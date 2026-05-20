"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Reply, Loader2 } from "lucide-react";
import { formatHebrewDate } from "@/lib/utils/dates";

type CommentItem = {
  id: number;
  bodyText: string;
  createdAt: Date;
  status: "visible" | "hidden" | "pending_review";
  reportCount: number;
  editorReplyText: string | null;
  editorRepliedAt: Date | null;
  authorName: string | null;
};

type Props = {
  articleId: number;
  comments: CommentItem[];
};

export function CommentsInbox({ comments }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pending, startBusy] = useTransition();
  const [openReply, setOpenReply] = useState<number | null>(null);

  async function action(id: number, kind: "hide" | "unhide") {
    setBusyId(id);
    startBusy(async () => {
      const res = await fetch(`/api/author/comments/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: kind === "hide" ? "hidden" : "visible",
        }),
      });
      setBusyId(null);
      if (res.ok) router.refresh();
    });
  }

  async function reply(id: number, text: string) {
    setBusyId(id);
    startBusy(async () => {
      const res = await fetch(`/api/author/comments/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ editorReplyText: text }),
      });
      setBusyId(null);
      if (res.ok) {
        setOpenReply(null);
        router.refresh();
      }
    });
  }

  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        אין עדיין תגובות למאמר זה.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <li
          key={c.id}
          className={`rounded-md border bg-card p-4 text-sm ${
            c.reportCount > 0 ? "border-destructive" : "border-border"
          }`}
        >
          <header className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {c.authorName ?? "משתמש"}
            </span>
            <time>{formatHebrewDate(c.createdAt)}</time>
          </header>
          <div className="mt-2 flex gap-1.5 flex-wrap text-xs">
            {c.status === "hidden" && (
              <span className="rounded-full bg-muted px-2 py-0.5">מוסתרת</span>
            )}
            {c.reportCount > 0 && (
              <span className="rounded-full bg-destructive/10 text-destructive px-2 py-0.5">
                דווחה ({c.reportCount})
              </span>
            )}
          </div>
          <p className="mt-2 whitespace-pre-line leading-relaxed">
            {c.bodyText}
          </p>

          {c.editorReplyText && (
            <blockquote className="mt-3 rounded-md border-s-2 border-accent bg-muted/40 px-3 py-2">
              <div className="text-xs font-medium text-muted-foreground">
                תגובת עורך
              </div>
              <p className="mt-1 whitespace-pre-line">{c.editorReplyText}</p>
            </blockquote>
          )}

          {openReply === c.id && (
            <ReplyBox
              initial={c.editorReplyText ?? ""}
              onCancel={() => setOpenReply(null)}
              onSave={(t) => reply(c.id, t)}
              busy={pending && busyId === c.id}
            />
          )}

          <div className="mt-3 flex gap-2 justify-end">
            {openReply !== c.id && (
              <button
                type="button"
                onClick={() => setOpenReply(c.id)}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-muted"
              >
                <Reply size={13} />
                השב כעורך
              </button>
            )}
            <button
              type="button"
              disabled={pending && busyId === c.id}
              onClick={() =>
                action(c.id, c.status === "hidden" ? "unhide" : "hide")
              }
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-muted disabled:opacity-50"
            >
              {pending && busyId === c.id ? (
                <Loader2 size={13} className="animate-spin" />
              ) : c.status === "hidden" ? (
                <Eye size={13} />
              ) : (
                <EyeOff size={13} />
              )}
              {c.status === "hidden" ? "החזר" : "הסתר"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ReplyBox({
  initial,
  onCancel,
  onSave,
  busy,
}: {
  initial: string;
  onCancel: () => void;
  onSave: (t: string) => void;
  busy: boolean;
}) {
  const [t, setT] = useState(initial);
  return (
    <div className="mt-3">
      <textarea
        rows={3}
        value={t}
        onChange={(e) => setT(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-2 py-1 rounded hover:bg-muted"
        >
          ביטול
        </button>
        <button
          type="button"
          disabled={busy || !t.trim()}
          onClick={() => onSave(t)}
          className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground disabled:opacity-50"
        >
          שמור
        </button>
      </div>
    </div>
  );
}
