import { getRecentArticles } from "@/lib/search/queries";
import { siteConfig } from "@/lib/utils/site";
import { truncateText } from "@/lib/utils/sanitize";

export const revalidate = 600;

export async function GET() {
  const base = siteConfig.url.replace(/\/$/, "");
  let items: Awaited<ReturnType<typeof getRecentArticles>> = [];
  try {
    items = await getRecentArticles(30);
  } catch (err) {
    console.error("[rss] failed", err);
  }

  const xmlItems = items
    .map((a) => {
      const link = `${base}/article/${a.slug}`;
      const pubDate = a.publishedAt
        ? new Date(a.publishedAt).toUTCString()
        : new Date().toUTCString();
      const description = escapeXml(
        truncateText(a.description ?? a.periodAndContext ?? "", 280)
      );
      return `<item>
        <title>${escapeXml(a.title)}</title>
        <link>${link}</link>
        <guid isPermaLink="true">${link}</guid>
        <pubDate>${pubDate}</pubDate>
        <description>${description}</description>
      </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${base}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>he</language>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
    ${xmlItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=600",
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
