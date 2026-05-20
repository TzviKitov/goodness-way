import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { articles, comments } from "@/lib/db/schema";
import { rateLimit } from "@/lib/ratelimit";
import { emailTemplates, sendEmail } from "@/lib/email/resend";
import { absoluteUrl } from "@/lib/utils/site";

const Body = z.object({
  articleId: z.number().int().positive(),
  body: z.string().trim().min(2).max(4000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rl = await rateLimit("comment", session.user.id ?? session.user.email ?? "anon");
  if (!rl.success) {
    return NextResponse.json(
      { error: "יותר מדי תגובות בזמן קצר. נסה שוב בעוד דקה." },
      { status: 429 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "פרטים שגויים" }, { status: 400 });
  }

  const articleRow = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      status: articles.status,
    })
    .from(articles)
    .where(eq(articles.id, parsed.data.articleId))
    .limit(1);
  const article = articleRow[0];
  if (!article || article.status !== "published") {
    return NextResponse.json({ error: "המאמר לא נמצא" }, { status: 404 });
  }

  const [inserted] = await db
    .insert(comments)
    .values({
      articleId: article.id,
      userId: session.user.id,
      bodyText: parsed.data.body,
    })
    .returning({ id: comments.id });

  const notify = process.env.AUTHOR_NOTIFY_EMAIL;
  if (notify) {
    const tpl = emailTemplates.newComment({
      articleTitle: article.title,
      articleUrl: absoluteUrl(`/article/${article.slug}#comments`),
      commenterName: session.user.name ?? "קורא",
      commentText: parsed.data.body,
    });
    void sendEmail({ to: notify, ...tpl });
  }

  return NextResponse.json({ id: inserted.id }, { status: 201 });
}
