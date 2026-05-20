import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { AuthError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";

const Body = z.object({
  status: z.enum(["visible", "hidden", "pending_review"]).optional(),
  editorReplyText: z.string().max(4000).optional().nullable(),
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
    return NextResponse.json({ error: "פרטים שגויים" }, { status: 400 });
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.status) updates.status = parsed.data.status;
  if (parsed.data.editorReplyText !== undefined) {
    updates.editorReplyText = parsed.data.editorReplyText;
    updates.editorRepliedAt = parsed.data.editorReplyText ? new Date() : null;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "אין מה לעדכן" }, { status: 400 });
  }
  await db.update(comments).set(updates).where(eq(comments.id, id));
  return NextResponse.json({ ok: true });
}
