import { ImageResponse } from "next/og";
import { getArticleBySlug } from "@/lib/search/queries";
import { siteConfig } from "@/lib/utils/site";

export const runtime = "edge";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const article = await getArticleBySlug(slug).catch(() => null);
  const title = article?.title ?? siteConfig.name;
  const description = article?.description ?? siteConfig.description;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(180deg, #f5efe2, #e6dcc4)",
          fontFamily: "serif",
          direction: "rtl",
        }}
      >
        <div style={{ fontSize: 28, color: "#6b5b3a", letterSpacing: 4 }}>
          {siteConfig.name}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            color: "#2b2418",
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.15 }}>
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.45,
                color: "#4d3f25",
                maxWidth: 1000,
              }}
            >
              {description.slice(0, 180)}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 22,
            color: "#6b5b3a",
          }}
        >
          <span>{siteConfig.authorName}</span>
          <span>{new URL(siteConfig.url).host}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
