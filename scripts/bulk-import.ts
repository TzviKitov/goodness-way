/**
 * Bulk import of Word articles from a local folder + CSV metadata.
 *
 * Usage:
 *   tsx scripts/bulk-import.ts --csv ./imports/articles.csv --files ./imports/files
 *
 * CSV columns (UTF-8, with header):
 *   filename,title,description,period_and_context,written_at,categories,status
 *
 * - filename: relative to --files, may be .doc or .docx
 * - written_at: YYYY-MM-DD (optional)
 * - categories: slugs separated by '|' (created on the fly if missing)
 * - status: draft | published (default draft)
 */

import "@/lib/env/load-local";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  articleCategories,
  articles,
  categories,
} from "@/lib/db/schema";
import { convertDocx } from "@/lib/word/convert";
import { htmlToPlainText, sanitizeArticleHtml } from "@/lib/utils/sanitize";
import { buildSlug, withCollisionSuffix } from "@/lib/utils/transliterate";

const execFileP = promisify(execFile);

type Row = {
  filename: string;
  title: string;
  description?: string;
  period_and_context?: string;
  written_at?: string;
  categories?: string;
  status?: "draft" | "published";
};

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1];
      if (val && !val.startsWith("--")) {
        out[key] = val;
        i++;
      } else {
        out[key] = "true";
      }
    }
  }
  return out;
}

function parseCsv(text: string): Row[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((l) => {
    const cells = splitCsvLine(l);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (cells[i] ?? "").trim();
    });
    return obj as unknown as Row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

async function convertDocToDocxLocal(input: string): Promise<string> {
  const out = await fs.mkdtemp(path.join(tmpdir(), "gw-doc-"));
  const candidates = process.platform === "win32"
    ? [
        "soffice",
        "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
        "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
      ]
    : ["soffice", "libreoffice"];
  let lastErr: unknown = null;
  for (const cmd of candidates) {
    try {
      await execFileP(cmd, [
        "--headless",
        "--convert-to",
        "docx",
        "--outdir",
        out,
        input,
      ]);
      const name = path.basename(input).replace(/\.[^.]+$/, ".docx");
      return path.join(out, name);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(
    `LibreOffice (soffice) not found. Install it and rerun. Last error: ${String(
      lastErr
    )}`
  );
}

async function getOrCreateCategory(slug: string, nameHe: string) {
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (existing[0]) return existing[0].id;
  const [maxRow] = await db
    .select({ m: sql<number>`coalesce(max(${categories.displayOrder}), 0)` })
    .from(categories);
  const inserted = await db
    .insert(categories)
    .values({ slug, nameHe, displayOrder: (maxRow?.m ?? 0) + 1 })
    .returning({ id: categories.id });
  return inserted[0].id;
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let candidate = base;
  for (let i = 1; i < 1000; i++) {
    candidate = withCollisionSuffix(base, i);
    const e = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, candidate))
      .limit(1);
    if (e.length === 0) return candidate;
  }
  return `${base}-${Date.now()}`;
}

async function main() {
  const args = parseArgs(process.argv);
  const csvPath = args.csv;
  const filesDir = args.files;
  if (!csvPath || !filesDir) {
    console.error(
      "Usage: tsx scripts/bulk-import.ts --csv <file.csv> --files <dir>"
    );
    process.exit(1);
  }
  const csvText = await fs.readFile(csvPath, "utf-8");
  const rows = parseCsv(csvText);
  console.info(`[import] ${rows.length} rows`);

  let success = 0;
  let failed = 0;

  for (const row of rows) {
    const filePath = path.join(filesDir, row.filename);
    try {
      const stat = await fs.stat(filePath).catch(() => null);
      if (!stat) throw new Error("file not found");

      let buf = await fs.readFile(filePath);
      const ext = path.extname(row.filename).toLowerCase();
      let format: "docx" | "doc" = "docx";
      if (ext === ".doc") {
        format = "doc";
        const docxPath = await convertDocToDocxLocal(filePath);
        buf = await fs.readFile(docxPath);
      } else if (ext !== ".docx") {
        throw new Error("unsupported extension " + ext);
      }
      const { html: rawHtml } = await convertDocx(buf);
      const html = sanitizeArticleHtml(rawHtml);
      const bodyText = htmlToPlainText(html);
      const hash = createHash("sha256")
        .update(await fs.readFile(filePath))
        .digest("hex");

      const slug = await ensureUniqueSlug(buildSlug(row.title));
      const status = row.status === "published" ? "published" : "draft";

      const [inserted] = await db
        .insert(articles)
        .values({
          slug,
          title: row.title,
          description: row.description || null,
          periodAndContext: row.period_and_context || null,
          writtenAt: row.written_at || null,
          status,
          bodyHtml: html,
          bodyText,
          sourceFileFormat: format,
          sourceFileHash: hash,
          sourceFileName: row.filename,
          publishedAt: status === "published" ? new Date() : null,
        })
        .returning({ id: articles.id });

      if (row.categories) {
        const slugs = row.categories.split("|").map((s) => s.trim()).filter(Boolean);
        for (const cSlug of slugs) {
          const niceName = cSlug.replace(/-/g, " ");
          const catId = await getOrCreateCategory(cSlug, niceName);
          await db
            .insert(articleCategories)
            .values({ articleId: inserted.id, categoryId: catId })
            .onConflictDoNothing();
        }
      }
      console.info(`[import] ✓ ${row.title}`);
      success++;
    } catch (err) {
      failed++;
      console.error(`[import] ✗ ${row.filename}:`, err);
    }
  }
  console.info(`[import] done. success=${success} failed=${failed}`);
}

void main();
