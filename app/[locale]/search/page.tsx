import type { Metadata } from "next";
import { Link } from "@/lib/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ArticleCard } from "@/components/article/article-card";
import { SearchBar } from "@/components/search/search-bar";
import { AdvancedFilters } from "@/components/search/advanced-filters";
import { listCategories, searchPublishedArticles } from "@/lib/search/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "חיפוש",
  robots: { index: false, follow: true },
};

type SP = Record<string, string | string[] | undefined>;

function pick(sp: SP, key: string): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const filters = {
    query: pick(sp, "q"),
    categorySlug: pick(sp, "category"),
    period: pick(sp, "period"),
    writtenFrom: pick(sp, "wfrom"),
    writtenTo: pick(sp, "wto"),
    publishedFrom: pick(sp, "pfrom"),
    publishedTo: pick(sp, "pto"),
    page: Number(pick(sp, "page") ?? "1") || 1,
  };

  const t = await getTranslations("search");
  const [{ items, hasMore, page }, categories] = await Promise.all([
    searchPublishedArticles(filters),
    listCategories(),
  ]);

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") params.set(k, v);
  }

  return (
    <section className="container-wide py-10 md:py-14">
      <h1 className="text-2xl md:text-4xl font-bold mb-6">{t("title")}</h1>
      <SearchBar defaultValue={filters.query ?? ""} />
      <div className="mt-4">
        <AdvancedFilters
          categories={categories.map((c) => ({
            slug: c.slug,
            nameHe: c.nameHe,
          }))}
          values={filters}
        />
      </div>

      <div className="mt-8">
        {items.length === 0 ? (
          <p className="text-muted-foreground">{t("noResults")}</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {t("resultsCount", { count: items.length })}
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              {items.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
            {(hasMore || page > 1) && (
              <nav className="mt-8 flex gap-3 justify-center">
                {page > 1 && (
                  <PageLink
                    base={params}
                    page={page - 1}
                    label={t("submit")}
                    invertedLabel="הקודם"
                  />
                )}
                {hasMore && (
                  <PageLink
                    base={params}
                    page={page + 1}
                    label={t("submit")}
                    invertedLabel="הבא"
                  />
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function PageLink({
  base,
  page,
  invertedLabel,
}: {
  base: URLSearchParams;
  page: number;
  label: string;
  invertedLabel: string;
}) {
  const next = new URLSearchParams(base);
  next.set("page", String(page));
  return (
    <Link
      href={`/search?${next.toString()}`}
      className="px-4 py-2 rounded-md border border-border hover:bg-muted"
    >
      {invertedLabel}
    </Link>
  );
}
