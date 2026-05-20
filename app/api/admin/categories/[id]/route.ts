import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { AuthError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"]);
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
  await db.delete(categories).where(eq(categories.id, id));
  return NextResponse.json({ ok: true });
}
