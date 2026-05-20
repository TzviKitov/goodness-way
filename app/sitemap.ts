import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, categories } from "@/lib/db/schema";
import { siteConfig } from "@/lib/utils/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  let articleUrls: MetadataRoute.Sitemap = [];
  let categoryUrls: MetadataRoute.Sitemap = [];
  try {
    const articleRows = await db
      .select({
        slug: articles.slug,
        updatedAt: articles.updatedAt,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.publishedAt));
    articleUrls = articleRows.map((a) => ({
      url: `${base}/article/${a.slug}`,
      lastModified: a.updatedAt ?? a.publishedAt ?? undefined,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

    const categoryRows = await db
      .select({ slug: categories.slug })
      .from(categories);
    categoryUrls = categoryRows.map((c) => ({
      url: `${base}/category/${c.slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch (err) {
    console.error("[sitemap] failed", err);
  }

  return [...staticUrls, ...categoryUrls, ...articleUrls];
}
