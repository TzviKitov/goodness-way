import { and, asc, eq, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, jobs, llmPrompts } from "@/lib/db/schema";
import { defaultPrompts, getLlmProvider } from "@/lib/llm";
import { htmlToPlainText, sanitizeArticleHtml } from "@/lib/utils/sanitize";

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 3;

export async function runDueJobs(): Promise<{
  processed: number;
  errors: number;
}> {
  let processed = 0;
  let errors = 0;
  for (let i = 0; i < BATCH_SIZE; i++) {
    const claimed = await claimNextJob();
    if (!claimed) break;
    try {
      await executeJob(claimed);
      await db
        .update(jobs)
        .set({ status: "done", updatedAt: new Date() })
        .where(eq(jobs.id, claimed.id));
      processed++;
    } catch (err) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      const attempts = claimed.attempts + 1;
      const giveUp = attempts >= MAX_ATTEMPTS;
      await db
        .update(jobs)
        .set({
          status: giveUp ? "error" : "queued",
          attempts,
          lastError: msg.slice(0, 1000),
          runAfter: giveUp ? new Date() : new Date(Date.now() + 60_000 * attempts),
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, claimed.id));
    }
  }
  return { processed, errors };
}

async function claimNextJob() {
  const rows = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, "queued"), lte(jobs.runAfter, new Date())))
    .orderBy(asc(jobs.runAfter))
    .limit(1);
  const job = rows[0];
  if (!job) return null;
  const updated = await db
    .update(jobs)
    .set({ status: "running", updatedAt: new Date() })
    .where(and(eq(jobs.id, job.id), eq(jobs.status, "queued")))
    .returning();
  return updated[0] ?? null;
}

type JobPayload = {
  articleId?: number;
  locale?: string;
  promptVersionId?: number;
};

async function executeJob(job: {
  id: number;
  kind: "convert_word" | "llm_summary" | "llm_edited" | "llm_translate";
  payload: unknown;
  attempts: number;
}) {
  const payload = (job.payload ?? {}) as JobPayload;
  switch (job.kind) {
    case "llm_summary":
      return runLlmTask(payload, "summary");
    case "llm_edited":
      return runLlmTask(payload, "edited");
    case "llm_translate":
      return runLlmTask(payload, "translate");
    case "convert_word":
      throw new Error("convert_word is handled inline on upload.");
    default:
      throw new Error(`Unknown job kind: ${job.kind}`);
  }
}

async function runLlmTask(
  payload: JobPayload,
  task: "summary" | "edited" | "translate"
) {
  if (!payload.articleId) throw new Error("articleId is required");
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.id, payload.articleId))
    .limit(1);
  const article = rows[0];
  if (!article) throw new Error("Article not found");
  if (!article.bodyText) throw new Error("Article has no body text");

  const prompt = await loadPrompt(task);
  const provider = getLlmProvider();
  const response = await provider.generate({
    task,
    prompt,
    text: article.bodyText,
    locale: payload.locale,
  });

  if (task === "summary") {
    await db
      .update(articles)
      .set({ summary: response.output, updatedAt: new Date() })
      .where(eq(articles.id, article.id));
  } else if (task === "edited") {
    const safe = sanitizeArticleHtml(response.output);
    await db
      .update(articles)
      .set({ editedBodyHtml: safe, updatedAt: new Date() })
      .where(eq(articles.id, article.id));
  } else {
    const _bodyText = htmlToPlainText(response.output);
    console.info(`[llm] translate completed for article ${article.id}`);
  }
}

async function loadPrompt(
  kind: "summary" | "edited" | "translate"
): Promise<string> {
  const rows = await db
    .select({ promptText: llmPrompts.promptText })
    .from(llmPrompts)
    .where(and(eq(llmPrompts.kind, kind), eq(llmPrompts.isActive, true)))
    .orderBy(sql`${llmPrompts.version} desc`)
    .limit(1);
  return rows[0]?.promptText ?? defaultPrompts[kind];
}

export async function enqueueLlmJob(
  kind: "llm_summary" | "llm_edited" | "llm_translate",
  payload: JobPayload
) {
  await db.insert(jobs).values({ kind, payload, status: "queued" });
}
