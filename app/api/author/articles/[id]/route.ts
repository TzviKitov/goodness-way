import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, inArray, ne } from "drizzle-orm";
import { AuthError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { articleCategories, articles, categories } from "@/lib/db/schema";

const Body = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(2000).optional().nullable(),
  periodAndContext: z.string().max(5000).optional().nullable(),
  writtenAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  categoryIds: z.array(z.number().int().positive()).max(10).default([]),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["author", "admin"]);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "פרטים חסרים או שגויים" }, { status: 400 });
  }
  const v = parsed.data;

  if (v.categoryIds.length > 0) {
    const found = await db
      .select({ id: categories.id })
      .from(categories)
      .where(inArray(categories.id, v.categoryIds));
    if (found.length !== v.categoryIds.length) {
      return NextResponse.json(
        { error: "קטגוריה לא קיימת" },
        { status: 400 }
      );
    }
  }

  const wantPublish = v.status === "published";
  const updates: Record<string, unknown> = {
    title: v.title,
    description: v.description ?? null,
    periodAndContext: v.periodAndContext ?? null,
    writtenAt: v.writtenAt ?? null,
    updatedAt: new Date(),
  };
  if (v.status) updates.status = v.status;
  if (wantPublish) updates.publishedAt = new Date();

  const updated = await db
    .update(articles)
    .set(updates)
    .where(eq(articles.id, id))
    .returning({
      id: articles.id,
      slug: articles.slug,
      status: articles.status,
    });
  if (updated.length === 0) {
    return NextResponse.json({ error: "המאמר לא נמצא" }, { status: 404 });
  }

  await db
    .delete(articleCategories)
    .where(
      and(
        eq(articleCategories.articleId, id),
        v.categoryIds.length === 0 ? undefined : ne(articleCategories.categoryId, 0)
      )
    );
  if (v.categoryIds.length > 0) {
    await db
      .insert(articleCategories)
      .values(v.categoryIds.map((cid) => ({ articleId: id, categoryId: cid })))
      .onConflictDoNothing();
  }

  return NextResponse.json({
    id: updated[0].id,
    slug: updated[0].slug,
    status: updated[0].status,
  });
}
