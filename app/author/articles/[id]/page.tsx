import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  articleCategories,
  articles,
  comments,
  users,
} from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { listCategories } from "@/lib/search/queries";
import { EditArticleForm } from "./edit-form";
import { CommentsInbox } from "./comments-inbox";
import { formatHebrewDate } from "@/lib/utils/dates";

type Params = { params: Promise<{ id: string }> };

export default async function AuthorArticlePage({ params }: Params) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  const article = rows[0];
  if (!article) notFound();

  const [cats, selectedRows, commentRows] = await Promise.all([
    listCategories(),
    db
      .select({ categoryId: articleCategories.categoryId })
      .from(articleCategories)
      .where(eq(articleCategories.articleId, id)),
    db
      .select({
        id: comments.id,
        bodyText: comments.bodyText,
        createdAt: comments.createdAt,
        status: comments.status,
        reportCount: comments.reportCount,
        editorReplyText: comments.editorReplyText,
        editorRepliedAt: comments.editorRepliedAt,
        authorName: users.name,
      })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.userId))
      .where(eq(comments.articleId, id))
      .orderBy(desc(comments.createdAt)),
  ]);

  return (
    <div className="grid lg:grid-cols-[1fr,360px] gap-8">
      <div>
        <Link
          href="/author"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← חזרה לרשימה
        </Link>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold">{article.title}</h1>
        <p className="text-sm text-muted-foreground">
          סטטוס: {article.status === "published" ? "מפורסם" : "טיוטה"} ·{" "}
          {formatHebrewDate(article.updatedAt)}
        </p>

        <section className="mt-6 rounded-md border border-border bg-card p-5">
          <EditArticleForm
            article={{
              id: article.id,
              title: article.title,
              description: article.description ?? "",
              periodAndContext: article.periodAndContext ?? "",
              writtenAt: article.writtenAt ?? "",
              status: article.status,
            }}
            categories={cats.map((c) => ({ id: c.id, nameHe: c.nameHe }))}
            selectedCategoryIds={selectedRows.map((r) => r.categoryId)}
          />
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-3">תצוגה מקדימה</h2>
          <article className="prose-article rounded-md border border-border bg-card p-6">
            <div dangerouslySetInnerHTML={{ __html: article.bodyHtml ?? "" }} />
          </article>
        </section>
      </div>

      <aside>
        <h2 className="text-xl font-semibold mb-3">תגובות</h2>
        <CommentsInbox articleId={id} comments={commentRows} />
      </aside>
    </div>
  );
}
