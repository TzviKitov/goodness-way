import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { AuthError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { buildSlug, withCollisionSuffix } from "@/lib/utils/transliterate";
import { eq } from "drizzle-orm";

const Body = z.object({
  nameHe: z.string().trim().min(1).max(128),
  description: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  try {
    await requireRole(["admin"]);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "שם חסר" }, { status: 400 });
  }
  const base = buildSlug(parsed.data.nameHe);
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    if (existing.length === 0) break;
    slug = withCollisionSuffix(base, i);
  }

  const [maxRow] = await db
    .select({ m: sql<number>`coalesce(max(${categories.displayOrder}), 0)` })
    .from(categories);

  const [inserted] = await db
    .insert(categories)
    .values({
      slug,
      nameHe: parsed.data.nameHe,
      description: parsed.data.description ?? null,
      displayOrder: (maxRow?.m ?? 0) + 1,
    })
    .returning();

  return NextResponse.json({
    id: inserted.id,
    slug: inserted.slug,
    nameHe: inserted.nameHe,
  });
}
