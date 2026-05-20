"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = { commentId: number };

export function ReportButton({ commentId }: Props) {
  const t = useTranslations("article");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function report() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/comments/${commentId}/report`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "שגיאה");
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <span className="text-xs text-muted-foreground">{t("reported")}</span>
    );
  }

  return (
    <button
      type="button"
      onClick={report}
      disabled={pending}
      aria-label={t("report")}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-60"
    >
      <Flag size={13} />
      {error ?? t("report")}
    </button>
  );
}
