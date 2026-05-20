import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArticleCard } from "@/components/article/article-card";
import {
  getCategoryBySlug,
  searchPublishedArticles,
} from "@/lib/search/queries";
import { absoluteUrl, siteConfig } from "@/lib/utils/site";

export const revalidate = 120;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "קטגוריה לא נמצאה" };
  const url = absoluteUrl(`/category/${slug}`);
  return {
    title: category.nameHe,
    description:
      category.description ??
      `מאמרים בקטגוריה ${category.nameHe} ב${siteConfig.name}.`,
    alternates: { canonical: url },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const t = await getTranslations("category");

  const { items } = await searchPublishedArticles({
    categorySlug: category.slug,
    pageSize: 30,
  });

  return (
    <section className="container-wide py-10 md:py-14">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">{category.nameHe}</h1>
        {category.description && (
          <p className="mt-3 text-muted-foreground max-w-2xl leading-relaxed">
            {category.description}
          </p>
        )}
      </header>
      {items.length === 0 ? (
        <p className="text-muted-foreground">{t("noArticles")}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </section>
  );
}
