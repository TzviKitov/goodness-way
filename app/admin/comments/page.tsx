import Link from "next/link";
import { and, desc, eq, gt, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, comments, users } from "@/lib/db/schema";
import { formatHebrewDate } from "@/lib/utils/dates";

export default async function ReportedCommentsPage() {
  const rows = await db
    .select({
      id: comments.id,
      bodyText: comments.bodyText,
      status: comments.status,
      reportCount: comments.reportCount,
      createdAt: comments.createdAt,
      articleId: articles.id,
      articleSlug: articles.slug,
      articleTitle: articles.title,
      authorName: users.name,
    })
    .from(comments)
    .innerJoin(articles, eq(articles.id, comments.articleId))
    .innerJoin(users, eq(users.id, comments.userId))
    .where(or(gt(comments.reportCount, 0), eq(comments.status, "hidden")))
    .orderBy(desc(comments.reportCount), desc(comments.createdAt))
    .limit(100);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">תגובות מדווחות</h1>
      <ul className="space-y-3">
        {rows.length === 0 && (
          <li className="text-muted-foreground">אין תגובות מדווחות.</li>
        )}
        {rows.map((c) => (
          <li
            key={c.id}
            className="rounded-md border border-destructive/40 bg-card p-4"
          >
            <header className="text-sm text-muted-foreground flex items-center justify-between">
              <span>{c.authorName ?? "משתמש"}</span>
              <time>{formatHebrewDate(c.createdAt)}</time>
            </header>
            <p className="mt-2 whitespace-pre-line">{c.bodyText}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              דיווחים: {c.reportCount} · סטטוס: {c.status}
            </div>
            <div className="mt-2 text-sm">
              <Link
                className="underline text-accent"
                href={`/article/${c.articleSlug}#comments`}
              >
                במאמר: {c.articleTitle}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
