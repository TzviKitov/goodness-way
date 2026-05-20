import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { buildStorageKey, putObject } from "@/lib/storage/r2";
import { convertDocToDocx, convertDocx } from "@/lib/word/convert";
import { htmlToPlainText, sanitizeArticleHtml } from "@/lib/utils/sanitize";
import { buildSlug, withCollisionSuffix } from "@/lib/utils/transliterate";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    await requireRole(["author", "admin"]);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "קובץ חסר" }, { status: 400 });
  }
  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".docx") && !lower.endsWith(".doc")) {
    return NextResponse.json(
      { error: "רק קבצי Word (.docx / .doc) נתמכים" },
      { status: 400 }
    );
  }
  const arrayBuf = await file.arrayBuffer();
  const buf: Buffer = Buffer.from(new Uint8Array(arrayBuf));
  const sourceFormat: "docx" | "doc" = lower.endsWith(".docx") ? "docx" : "doc";

  let docxBuf: Buffer = buf;
  if (sourceFormat === "doc") {
    try {
      const converted = await convertDocToDocx(buf, file.name);
      if (!converted) {
        return NextResponse.json(
          {
            error:
              "הקובץ הוא בפורמט .doc ישן. שמור אותו בוורד בתור .docx והעלה שוב.",
          },
          { status: 400 }
        );
      }
      docxBuf = converted;
    } catch (err) {
      console.error("[upload] doc conversion failed", err);
      return NextResponse.json(
        { error: "המרת .doc נכשלה. נסה לשמור כ-docx ולהעלות שוב." },
        { status: 500 }
      );
    }
  }

  let html = "";
  try {
    const result = await convertDocx(docxBuf);
    html = sanitizeArticleHtml(result.html);
  } catch (err) {
    console.error("[upload] docx parse failed", err);
    return NextResponse.json(
      { error: "לא הצלחנו לקרוא את תוכן הקובץ. ייתכן שהוא פגום." },
      { status: 500 }
    );
  }
  const bodyText = htmlToPlainText(html);
  const hash = createHash("sha256").update(buf).digest("hex");

  const suggestedTitle = deriveTitle(html, file.name);
  const slug = await ensureUniqueSlug(buildSlug(suggestedTitle));

  let r2Key: string | null = null;
  try {
    r2Key = buildStorageKey({
      scope: "drafts",
      id: slug,
      filename: file.name,
    });
    await putObject({
      key: r2Key,
      body: buf,
      contentType:
        sourceFormat === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/msword",
    });
  } catch (err) {
    console.warn("[upload] R2 store skipped", err);
    r2Key = null;
  }

  const [inserted] = await db
    .insert(articles)
    .values({
      slug,
      title: suggestedTitle,
      status: "draft",
      bodyHtml: html,
      bodyText,
      sourceFileFormat: sourceFormat,
      sourceFileHash: hash,
      sourceFileKey: r2Key,
      sourceFileName: file.name,
    })
    .returning({ id: articles.id, slug: articles.slug });

  return NextResponse.json({
    articleId: inserted.id,
    slug: inserted.slug,
    suggestedTitle,
    bodyHtml: html,
  });
}

function deriveTitle(html: string, filename: string): string {
  const h = html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
  if (h?.[1]) {
    const text = h[1].replace(/<[^>]+>/g, "").trim();
    if (text) return text.slice(0, 200);
  }
  const firstP = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (firstP?.[1]) {
    const text = firstP[1].replace(/<[^>]+>/g, "").trim();
    if (text) return text.slice(0, 80);
  }
  return filename.replace(/\.(docx?|doc)$/i, "").slice(0, 80) || "מאמר חדש";
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let candidate = base;
  for (let i = 1; i < 50; i++) {
    candidate = withCollisionSuffix(base, i);
    const existing = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, candidate))
      .limit(1);
    if (existing.length === 0) return candidate;
  }
  return `${base}-${Date.now()}`;
}
