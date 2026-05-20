import type { Metadata } from "next";
import { Link } from "@/lib/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ArticleCard } from "@/components/article/article-card";
import { SearchBar } from "@/components/search/search-bar";
import { getRecentArticles, listCategories } from "@/lib/search/queries";
import { siteConfig } from "@/lib/utils/site";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: { canonical: siteConfig.url },
  };
}

export default async function HomePage() {
  const t = await getTranslations();
  let articles: Awaited<ReturnType<typeof getRecentArticles>> = [];
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  try {
    [articles, categories] = await Promise.all([
      getRecentArticles(12),
      listCategories(),
    ]);
  } catch (err) {
    console.error("[home] failed to load content", err);
  }

  return (
    <>
      <section className="container-wide py-12 md:py-16">
        <h1 className="text-3xl md:text-5xl font-bold leading-tight">
          {t("home.heroTitle")}
        </h1>
        <p className="mt-4 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
          {t("home.heroSubtitle")}
        </p>
        <div className="mt-6 max-w-xl">
          <SearchBar />
        </div>
      </section>

      <section className="container-wide pb-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold">
            {t("home.recentTitle")}
          </h2>
        </div>
        {articles.length === 0 ? (
          <p className="text-muted-foreground">{t("home.recentEmpty")}</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </section>

      {categories.length > 0 && (
        <section className="container-wide pb-16">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6">
            {t("home.browseByCategory")}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/category/${c.slug}`}
                  className="inline-flex rounded-full border border-border bg-card px-4 py-1.5 text-sm hover:bg-muted"
                >
                  {c.nameHe}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
