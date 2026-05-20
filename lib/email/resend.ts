import { Resend } from "resend";

let cachedClient: Resend | null = null;

export function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) cachedClient = new Resend(apiKey);
  return cachedClient;
}

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(args: SendArgs): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("[resend] RESEND_API_KEY not set; skipping email", args.subject);
    return false;
  }
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  try {
    await client.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    return true;
  } catch (err) {
    console.error("[resend] failed to send", err);
    return false;
  }
}

export const emailTemplates = {
  newComment(args: {
    articleTitle: string;
    articleUrl: string;
    commenterName: string;
    commentText: string;
  }): { subject: string; html: string; text: string } {
    const safeText = args.commentText.slice(0, 800);
    return {
      subject: `תגובה חדשה למאמר: ${args.articleTitle}`,
      text: `${args.commenterName} הגיב על "${args.articleTitle}":\n\n${safeText}\n\n${args.articleUrl}`,
      html: `
        <div dir="rtl" style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="font-weight: 600;">תגובה חדשה למאמר</h2>
          <p><a href="${args.articleUrl}">${args.articleTitle}</a></p>
          <p><strong>${args.commenterName}</strong> כתב:</p>
          <blockquote style="border-inline-start: 3px solid #888; padding-inline-start: 12px; color: #333;">
            ${escapeHtml(safeText).replace(/\n/g, "<br/>")}
          </blockquote>
          <p><a href="${args.articleUrl}">לקריאה ומענה באתר</a></p>
        </div>
      `,
    };
  },

  commentReported(args: {
    articleTitle: string;
    articleUrl: string;
    commentText: string;
  }): { subject: string; html: string; text: string } {
    const safeText = args.commentText.slice(0, 800);
    return {
      subject: `דיווח על תגובה במאמר: ${args.articleTitle}`,
      text: `דווח על תגובה במאמר "${args.articleTitle}":\n\n${safeText}\n\n${args.articleUrl}`,
      html: `
        <div dir="rtl" style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="font-weight: 600;">דיווח על תגובה</h2>
          <p><a href="${args.articleUrl}">${args.articleTitle}</a></p>
          <blockquote style="border-inline-start: 3px solid #b85050; padding-inline-start: 12px; color: #333;">
            ${escapeHtml(safeText).replace(/\n/g, "<br/>")}
          </blockquote>
          <p>ניתן להסתיר או להגיב באתר.</p>
        </div>
      `,
    };
  },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
