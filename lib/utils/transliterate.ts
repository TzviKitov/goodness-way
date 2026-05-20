/**
 * תעתוק עברית→לטינית פשוט ויציב ל-slugs.
 * לא מדויק פונטית — מטרתו: URL ניתן לקריאה, מקור יציב, ל-SEO נכון.
 *
 * עקרונות:
 * - מסיר ניקוד וטעמי מקרא לפני המיפוי.
 * - ממפה אות אחת לאחת לפי תעתוק נפוץ.
 * - תווים שאינם אותיות מהופכים למקפים.
 * - שובר רצפי מקפים, חותך לאורך מקסימלי.
 */

const HEBREW_MAP: Record<string, string> = {
  "א": "a",
  "ב": "v",
  "ג": "g",
  "ד": "d",
  "ה": "h",
  "ו": "v",
  "ז": "z",
  "ח": "h",
  "ט": "t",
  "י": "y",
  "כ": "k",
  "ך": "k",
  "ל": "l",
  "מ": "m",
  "ם": "m",
  "נ": "n",
  "ן": "n",
  "ס": "s",
  "ע": "a",
  "פ": "p",
  "ף": "f",
  "צ": "tz",
  "ץ": "tz",
  "ק": "k",
  "ר": "r",
  "ש": "sh",
  "ת": "t",
  '"': "",
  "'": "",
  "״": "",
  "׳": "",
};

const NIQQUD = /[\u0591-\u05C7]/g;
const NON_SLUG = /[^a-z0-9]+/g;
const MULTI_DASH = /-{2,}/g;
const TRIM_DASH = /^-+|-+$/g;

export function transliterate(input: string): string {
  if (!input) return "";
  const stripped = input.normalize("NFC").replace(NIQQUD, "");
  let out = "";
  for (const ch of stripped) {
    if (HEBREW_MAP[ch] !== undefined) {
      out += HEBREW_MAP[ch];
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      out += ch.toLowerCase();
    } else {
      out += "-";
    }
  }
  return out
    .toLowerCase()
    .replace(NON_SLUG, "-")
    .replace(MULTI_DASH, "-")
    .replace(TRIM_DASH, "");
}

const MAX_SLUG_LEN = 80;

export function buildSlug(title: string, fallbackId?: number | string): string {
  let slug = transliterate(title);
  if (slug.length > MAX_SLUG_LEN) {
    slug = slug.slice(0, MAX_SLUG_LEN).replace(TRIM_DASH, "");
  }
  if (!slug) {
    slug = fallbackId !== undefined ? `article-${fallbackId}` : "article";
  }
  return slug;
}

export function withCollisionSuffix(base: string, suffix: number): string {
  if (suffix <= 1) return base;
  const trimmed = base.slice(0, MAX_SLUG_LEN - String(suffix).length - 1);
  return `${trimmed}-${suffix}`;
}
