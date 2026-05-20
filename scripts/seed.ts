/**
 * Seed initial categories. Idempotent.
 * Usage: tsx scripts/seed.ts
 */

import "@/lib/env/load-local";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";

const SEED = [
  { slug: "halacha", nameHe: "הלכה" },
  { slug: "machshava", nameHe: "מחשבה" },
  { slug: "moadim", nameHe: "מועדים" },
  { slug: "parashah", nameHe: "פרשת השבוע" },
  { slug: "chevrah", nameHe: "חברה ומשפחה" },
  { slug: "education", nameHe: "חינוך" },
  { slug: "philosophy", nameHe: "פילוסופיה ומחשבה כללית" },
];

async function main() {
  let order = 1;
  for (const c of SEED) {
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, c.slug))
      .limit(1);
    if (existing[0]) {
      console.info(`[seed] exists ${c.slug}`);
      continue;
    }
    await db.insert(categories).values({ ...c, displayOrder: order });
    console.info(`[seed] added ${c.slug}`);
    order++;
  }
  console.info("[seed] done");
}

void main();
