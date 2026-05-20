import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { formatHebrewDate } from "@/lib/utils/dates";

export default async function AuthorHome() {
  const items = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      status: articles.status,
      publishedAt: articles.publishedAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .orderBy(desc(articles.updatedAt))
    .limit(50);

  const drafts = items.filter((i) => i.status === "draft");
  const published = items.filter((i) => i.status === "published");

  return (
    <div className="space-y-10">
      <section className="rounded-lg bg-card border border-border p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">ברוך הבא לממשק הכותב</h1>
          <p className="mt-2 text-muted-foreground">
            כאן תוכל להעלות מאמר חדש, לערוך פרטים, ולעקוב אחרי תגובות.
          </p>
        </div>
        <div className="md:ms-auto">
          <Link
            href="/author/new"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-lg font-semibold hover:opacity-90"
          >
            + מאמר חדש
          </Link>
        </div>
      </section>

      <ArticleList title="טיוטות" items={drafts} emptyText="אין טיוטות כרגע." />
      <ArticleList
        title="מפורסמים"
        items={published}
        emptyText="עדיין לא פרסמת מאמרים."
      />
    </div>
  );
}

function ArticleList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: Array<{
    id: number;
    slug: string;
    title: string;
    status: "draft" | "published" | "archived";
    publishedAt: Date | null;
    updatedAt: Date | null;
  }>;
  emptyText: string;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">
        {title} <span className="text-muted-foreground">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border bg-card">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40"
            >
              <Link href={`/author/articles/${a.id}`} className="font-medium">
                {a.title}
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatHebrewDate(a.updatedAt ?? a.publishedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
