"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Props = {
  articleId: number;
  articleTitle: string;
};

export function CommentForm({ articleId }: Props) {
  const t = useTranslations("article");
  const tc = useTranslations("common");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function submit() {
    setError(null);
    const body = text.trim();
    if (body.length < 2) {
      setError("התגובה קצרה מדי.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ articleId, body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? tc("error"));
        return;
      }
      setText("");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-3"
    >
      <label className="block">
        <span className="sr-only">{t("writeComment")}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={t("writeComment")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring"
          maxLength={4000}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary text-primary-foreground px-5 py-2 font-medium hover:opacity-90 disabled:opacity-60"
        >
          {pending ? tc("loading") : t("submitComment")}
        </button>
      </div>
    </form>
  );
}
