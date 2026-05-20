import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { articles, commentReports, comments } from "@/lib/db/schema";
import { rateLimit } from "@/lib/ratelimit";
import { emailTemplates, sendEmail } from "@/lib/email/resend";
import { absoluteUrl } from "@/lib/utils/site";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const commentId = Number(id);
  if (!Number.isFinite(commentId)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }
  const rl = await rateLimit("comment", `report:${session.user.id}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "יותר מדי דיווחים בזמן קצר" },
      { status: 429 }
    );
  }

  try {
    await db.insert(commentReports).values({
      commentId,
      reporterUserId: session.user.id,
    });
  } catch {
    return NextResponse.json({ ok: true });
  }

  await db
    .update(comments)
    .set({ reportCount: sql`${comments.reportCount} + 1` })
    .where(eq(comments.id, commentId));

  const row = await db
    .select({
      bodyText: comments.bodyText,
      articleTitle: articles.title,
      articleSlug: articles.slug,
    })
    .from(comments)
    .innerJoin(articles, eq(articles.id, comments.articleId))
    .where(eq(comments.id, commentId))
    .limit(1);

  const notify = process.env.AUTHOR_NOTIFY_EMAIL;
  if (notify && row[0]) {
    const tpl = emailTemplates.commentReported({
      articleTitle: row[0].articleTitle,
      articleUrl: absoluteUrl(`/article/${row[0].articleSlug}#comments`),
      commentText: row[0].bodyText,
    });
    void sendEmail({ to: notify, ...tpl });
  }

  return NextResponse.json({ ok: true });
}
