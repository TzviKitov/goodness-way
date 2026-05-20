import { absoluteUrl, siteConfig } from "@/lib/utils/site";

type Props = {
  title: string;
  description: string;
  slug: string;
  publishedAt: Date | null;
  updatedAt: Date | null;
};

export function ArticleJsonLd({
  title,
  description,
  slug,
  publishedAt,
  updatedAt,
}: Props) {
  const url = absoluteUrl(`/article/${slug}`);
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    inLanguage: "he",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    datePublished: publishedAt?.toISOString(),
    dateModified: updatedAt?.toISOString() ?? publishedAt?.toISOString(),
    author: { "@type": "Person", name: siteConfig.authorName },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: siteConfig.name,
        item: siteConfig.url,
      },
      { "@type": "ListItem", position: 2, name: title, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}
