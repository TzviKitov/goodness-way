import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireRole } from "@/lib/auth/guards";
import { enqueueLlmJob } from "@/lib/jobs/runner";

const Body = z.object({
  articleId: z.number().int().positive(),
  task: z.enum(["summary", "edited", "translate"]),
  locale: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await requireRole(["admin", "author"]);
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
  const kindMap = {
    summary: "llm_summary" as const,
    edited: "llm_edited" as const,
    translate: "llm_translate" as const,
  };
  await enqueueLlmJob(kindMap[parsed.data.task], {
    articleId: parsed.data.articleId,
    locale: parsed.data.locale,
  });
  return NextResponse.json({ ok: true });
}
