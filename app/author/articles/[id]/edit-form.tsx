"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Article = {
  id: number;
  title: string;
  description: string;
  periodAndContext: string;
  writtenAt: string;
  status: "draft" | "published" | "archived";
};

type Category = { id: number; nameHe: string };

type Props = {
  article: Article;
  categories: Category[];
  selectedCategoryIds: number[];
};

export function EditArticleForm({
  article,
  categories,
  selectedCategoryIds,
}: Props) {
  const router = useRouter();
  const [state, setState] = useState({
    ...article,
    categoryIds: selectedCategoryIds,
  });
  const [busy, startBusy] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function save(publish: boolean) {
    setMsg(null);
    setErr(null);
    startBusy(async () => {
      const res = await fetch(`/api/author/articles/${article.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: state.title,
          description: state.description,
          periodAndContext: state.periodAndContext,
          writtenAt: state.writtenAt || null,
          categoryIds: state.categoryIds,
          status: publish ? "published" : state.status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data?.error ?? "שמירה נכשלה");
        return;
      }
      setMsg(publish ? "פורסם" : "נשמר");
      router.refresh();
    });
  }

  function toggleCat(id: number) {
    setState((s) => ({
      ...s,
      categoryIds: s.categoryIds.includes(id)
        ? s.categoryIds.filter((x) => x !== id)
        : [...s.categoryIds, id],
    }));
  }

  return (
    <div className="space-y-4">
      <Field label="כותרת">
        <input
          className="input"
          value={state.title}
          onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
        />
      </Field>
      <Field label="תיאור קצר">
        <textarea
          rows={3}
          className="input"
          value={state.description}
          onChange={(e) =>
            setState((s) => ({ ...s, description: e.target.value }))
          }
        />
      </Field>
      <Field label="תקופה ורקע">
        <textarea
          rows={3}
          className="input"
          value={state.periodAndContext}
          onChange={(e) =>
            setState((s) => ({ ...s, periodAndContext: e.target.value }))
          }
        />
      </Field>
      <Field label="תאריך כתיבה מקורי">
        <input
          type="date"
          className="input"
          value={state.writtenAt ?? ""}
          onChange={(e) =>
            setState((s) => ({ ...s, writtenAt: e.target.value }))
          }
        />
      </Field>

      <div>
        <span className="block text-base font-medium mb-1">קטגוריות</span>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => toggleCat(c.id)}
              className={`rounded-full px-3 py-1.5 text-sm border ${
                state.categoryIds.includes(c.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {c.nameHe}
            </button>
          ))}
        </div>
      </div>

      {err && <p className="text-destructive text-sm">{err}</p>}
      {msg && <p className="text-accent text-sm">{msg}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={() => save(false)}
          className="rounded-md border border-border px-4 py-2 hover:bg-muted disabled:opacity-50"
        >
          שמור
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => save(true)}
          className="rounded-md bg-primary text-primary-foreground px-5 py-2 font-semibold disabled:opacity-50"
        >
          {state.status === "published" ? "עדכן ופרסם" : "פרסם"}
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.4rem;
          border: 1px solid hsl(var(--input));
          background: hsl(var(--background));
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-base font-medium mb-1">{label}</span>
      {children}
    </label>
  );
}
