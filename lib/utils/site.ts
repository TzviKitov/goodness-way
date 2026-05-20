export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "בדרך טובים",
  description:
    "במה למאמרי הוגה דעות תורניים — קריאה, חיפוש מתקדם והתבוננות מעמיקה.",
  authorName: process.env.NEXT_PUBLIC_AUTHOR_NAME ?? "הכותב",
  locale: "he-IL",
  defaultLanguage: "he",
};

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = siteConfig.url.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
