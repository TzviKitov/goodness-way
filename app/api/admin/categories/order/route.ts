import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { AuthError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";

const Body = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(200),
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
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }
  for (let i = 0; i < parsed.data.ids.length; i++) {
    await db
      .update(categories)
      .set({ displayOrder: i })
      .where(eq(categories.id, parsed.data.ids[i]));
  }
  return NextResponse.json({ ok: true });
}
