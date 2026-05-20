import { Link } from "@/lib/i18n/navigation";
import { desc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { comments, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { formatHebrewDate } from "@/lib/utils/dates";
import { CommentForm } from "./comment-form";
import { ReportButton } from "./report-button";

type Props = {
  articleId: number;
  articleTitle: string;
};

export async function CommentsSection({ articleId, articleTitle }: Props) {
  const t = await getTranslations("article");
  const session = await auth();

  const rows = await db
    .select({
      id: comments.id,
      bodyText: comments.bodyText,
      createdAt: comments.createdAt,
      status: comments.status,
      editorReplyText: comments.editorReplyText,
      editorRepliedAt: comments.editorRepliedAt,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(eq(comments.articleId, articleId))
    .orderBy(desc(comments.createdAt));

  const visible = rows.filter((r) => r.status !== "hidden");

  return (
    <section id="comments" aria-labelledby="comments-heading" className="no-print">
      <h2 id="comments-heading" className="text-2xl font-semibold">
        {t("commentsTitle")}{" "}
        <span className="text-muted-foreground text-base">({visible.length})</span>
      </h2>

      <div className="mt-6">
        {session?.user ? (
          <CommentForm articleId={articleId} articleTitle={articleTitle} />
        ) : (
          <p className="text-sm">
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-accent"
            >
              {t("loginToComment")}
            </Link>
          </p>
        )}
      </div>

      <ul className="mt-8 space-y-6">
        {visible.length === 0 && (
          <li className="text-muted-foreground">{t("commentsEmpty")}</li>
        )}
        {visible.map((c) => (
          <li
            key={c.id}
            className="rounded-md border border-border bg-card p-4"
          >
            <div className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {c.authorName ?? "משתמש"}
              </span>
              <time dateTime={c.createdAt.toISOString()}>
                {formatHebrewDate(c.createdAt)}
              </time>
            </div>
            <p className="mt-2 whitespace-pre-line leading-relaxed">
              {c.bodyText}
            </p>
            {c.editorReplyText && (
              <blockquote className="mt-4 rounded-md border-s-4 border-accent bg-muted/50 px-3 py-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("editorReply")}
                </div>
                <p className="mt-1 whitespace-pre-line">{c.editorReplyText}</p>
              </blockquote>
            )}
            {session?.user && (
              <div className="mt-3 flex justify-end">
                <ReportButton commentId={c.id} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
