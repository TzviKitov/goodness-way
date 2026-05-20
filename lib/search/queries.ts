import { and, desc, eq, gte, ilike, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  articleCategories,
  articles,
  categories,
} from "@/lib/db/schema";

export type SearchFilters = {
  query?: string;
  categorySlug?: string;
  period?: string;
  writtenFrom?: string;
  writtenTo?: string;
  publishedFrom?: string;
  publishedTo?: string;
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 12;

export async function searchPublishedArticles(filters: SearchFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [eq(articles.status, "published")];

  if (filters.publishedFrom) {
    conditions.push(gte(articles.publishedAt, new Date(filters.publishedFrom)));
  }
  if (filters.publishedTo) {
    conditions.push(lte(articles.publishedAt, new Date(filters.publishedTo)));
  }
  if (filters.writtenFrom) {
    conditions.push(gte(articles.writtenAt, filters.writtenFrom));
  }
  if (filters.writtenTo) {
    conditions.push(lte(articles.writtenAt, filters.writtenTo));
  }
  if (filters.period) {
    conditions.push(ilike(articles.periodAndContext, `%${filters.period}%`));
  }

  let categoryId: number | null = null;
  if (filters.categorySlug) {
    const cat = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, filters.categorySlug))
      .limit(1);
    if (cat[0]) categoryId = cat[0].id;
  }

  const trimmedQuery = filters.query?.trim() ?? "";
  const hasFts = trimmedQuery.length > 0;

  const rankExpr = hasFts
    ? sql`ts_rank(${articles.searchVector}, websearch_to_tsquery('simple', ${trimmedQuery}))`
    : sql`0::float`;

  if (hasFts) {
    conditions.push(
      sql`${articles.searchVector} @@ websearch_to_tsquery('simple', ${trimmedQuery})`
    );
  }

  const baseQuery = db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      description: articles.description,
      periodAndContext: articles.periodAndContext,
      writtenAt: articles.writtenAt,
      publishedAt: articles.publishedAt,
      rank: rankExpr.as("rank"),
    })
    .from(articles);

  const filtered = categoryId
    ? baseQuery
        .innerJoin(
          articleCategories,
          eq(articleCategories.articleId, articles.id)
        )
        .where(and(eq(articleCategories.categoryId, categoryId), ...conditions))
    : baseQuery.where(and(...conditions));

  const rows = await filtered
    .orderBy(
      hasFts ? desc(sql`rank`) : desc(articles.publishedAt)
    )
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows,
    page,
    pageSize,
    hasMore: rows.length === pageSize,
  };
}

export async function getRecentArticles(limit = 12) {
  return db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      description: articles.description,
      periodAndContext: articles.periodAndContext,
      writtenAt: articles.writtenAt,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function getArticleBySlug(slug: string) {
  const rows = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
    .limit(1);
  return rows[0] ?? null;
}

export async function getArticleCategories(articleId: number) {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      nameHe: categories.nameHe,
    })
    .from(categories)
    .innerJoin(
      articleCategories,
      eq(articleCategories.categoryId, categories.id)
    )
    .where(eq(articleCategories.articleId, articleId));
}

export async function listCategories() {
  return db
    .select()
    .from(categories)
    .orderBy(categories.displayOrder, categories.nameHe);
}

export async function getCategoryBySlug(slug: string) {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}
