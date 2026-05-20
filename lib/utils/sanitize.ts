import sanitizeHtml from "sanitize-html";

/**
 * Sanitize HTML coming from Word conversion (mammoth / CloudConvert).
 * Whitelist focuses on long-form Hebrew prose, footnotes, blockquotes, citations.
 */
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "sup",
  "sub",
  "blockquote",
  "q",
  "cite",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "hr",
  "span",
  "div",
  "small",
  "abbr",
];

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "id", "name", "rel", "target"],
      span: ["class"],
      div: ["class"],
      sup: ["id", "class"],
      sub: ["id", "class"],
      li: ["id"],
      "*": ["dir", "lang"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: attribs.rel || "noopener nofollow",
          target: attribs.target || "_blank",
        },
      }),
    },
    nonTextTags: ["style", "script", "textarea", "option", "noscript"],
  });
}

/**
 * Strip HTML to plain text for body_text (search) and for previews.
 */
export function htmlToPlainText(html: string): string {
  const stripped = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  });
  return stripped
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Truncate plain text to a soft character limit on word boundary.
 */
export function truncateText(text: string, maxLen = 200): string {
  if (text.length <= maxLen) return text;
  const slice = text.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.6 ? slice.slice(0, lastSpace) : slice) + "…";
}
