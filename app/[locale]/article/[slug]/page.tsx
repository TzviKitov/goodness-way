import type { Metadata } from "next";
import { Link } from "@/lib/i18n/navigation";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PeriodContextBlock } from "@/components/article/period-context-block";
import { ArticleTabs } from "@/components/article/article-tabs";
import { CommentsSection } from "@/components/comments/comments-section";
import { ArticleJsonLd } from "@/components/seo/article-json-ld";
import {
  getArticleBySlug,
  getArticleCategories,
} from "@/lib/search/queries";
import { formatHebrewDate } from "@/lib/utils/dates";
import { absoluteUrl, siteConfig } from "@/lib/utils/site";
import { truncateText } from "@/lib/utils/sanitize";

export const revalidate = 120;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    return { title: "מאמר לא נמצא" };
  }
  const description =
    article.seoDescription ??
    article.description ??
    truncateText(article.bodyText ?? "", 160);
  const url = absoluteUrl(`/article/${article.slug}`);
  return {
    title: article.seoTitle ?? article.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.title,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      publishedTime: article.publishedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
    },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();
  const t = await getTranslations("article");
  const categories = await getArticleCategories(article.id);

  return (
    <>
      <ArticleJsonLd
        title={article.title}
        description={article.description ?? ""}
        slug={article.slug}
        publishedAt={article.publishedAt}
        updatedAt={article.updatedAt}
      />
      <article className="container-narrow py-10 md:py-14">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            {article.title}
          </h1>
          {article.description && (
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {article.description}
            </p>
          )}
          <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {article.publishedAt && (
              <div>
                <dt className="inline">{t("publishedAt")}: </dt>
                <dd className="inline">
                  <time dateTime={article.publishedAt.toISOString()}>
                    {formatHebrewDate(article.publishedAt)}
                  </time>
                </dd>
              </div>
            )}
            {categories.length > 0 && (
              <div className="flex gap-2 items-center">
                <dt>{t("categories")}: </dt>
                <dd className="flex gap-2 flex-wrap">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/category/${c.slug}`}
                      className="hover:text-foreground underline-offset-2 hover:underline"
                    >
                      {c.nameHe}
                    </Link>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </header>

        <PeriodContextBlock
          periodAndContext={article.periodAndContext}
          writtenAt={article.writtenAt}
        />

        <ArticleTabs
          bodyHtml={article.bodyHtml ?? ""}
          summary={article.summary}
          editedBodyHtml={article.editedBodyHtml}
        />

        <hr className="my-12 border-border" />
        <CommentsSection articleId={article.id} articleTitle={article.title} />
      </article>
    </>
  );
}
