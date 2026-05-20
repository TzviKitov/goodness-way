"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Upload, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

type Category = { id: number; nameHe: string };

type Step = 1 | 2 | 3 | 4;

type Draft = {
  articleId: number | null;
  file: File | null;
  fileName: string;
  fileFormat: "docx" | "doc" | null;
  bodyHtml: string;
  title: string;
  description: string;
  periodAndContext: string;
  writtenAt: string;
  categoryIds: number[];
};

const empty: Draft = {
  articleId: null,
  file: null,
  fileName: "",
  fileFormat: null,
  bodyHtml: "",
  title: "",
  description: "",
  periodAndContext: "",
  writtenAt: "",
  categoryIds: [],
};

export function NewArticleWizard({ categories }: { categories: Category[] }) {
  const t = useTranslations("author");
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<Draft>(empty);
  const [busy, startBusy] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setError(null);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".docx") && !lower.endsWith(".doc")) {
      setError("בחר קובץ Word (.docx או .doc).");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("הקובץ גדול מדי (מעל 25MB).");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    startBusy(async () => {
      const res = await fetch("/api/author/articles/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? t("uploadError"));
        return;
      }
      setDraft((d) => ({
        ...d,
        articleId: data.articleId,
        file,
        fileName: file.name,
        fileFormat: lower.endsWith(".docx") ? "docx" : "doc",
        bodyHtml: data.bodyHtml ?? "",
        title: data.suggestedTitle ?? d.title,
      }));
      setStep(2);
    });
  }

  async function saveAndPublish(publish: boolean) {
    if (!draft.articleId) {
      setError("העלה קובץ קודם.");
      return;
    }
    setError(null);
    startBusy(async () => {
      const res = await fetch(`/api/author/articles/${draft.articleId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          periodAndContext: draft.periodAndContext,
          writtenAt: draft.writtenAt || null,
          categoryIds: draft.categoryIds,
          status: publish ? "published" : "draft",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "שמירה נכשלה");
        return;
      }
      if (publish) {
        router.push(`/article/${data.slug}`);
      } else {
        router.push("/author");
      }
    });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Stepper step={step} />
      {error && (
        <p role="alert" className="mt-4 rounded-md bg-destructive/10 text-destructive px-4 py-2">
          {error}
        </p>
      )}

      <div className="mt-6 rounded-lg bg-card border border-border p-6">
        {step === 1 && (
          <StepFile
            onUpload={(f) => void uploadFile(f)}
            busy={busy}
            current={draft.fileName}
          />
        )}
        {step === 2 && (
          <StepDetails draft={draft} setDraft={setDraft} />
        )}
        {step === 3 && (
          <StepCategory
            categories={categories}
            selected={draft.categoryIds}
            onChange={(ids) => setDraft((d) => ({ ...d, categoryIds: ids }))}
          />
        )}
        {step === 4 && <StepPreview draft={draft} categories={categories} />}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => (Math.max(1, s - 1) as Step))}
          disabled={step === 1 || busy}
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-base disabled:opacity-40 hover:bg-muted"
        >
          <ArrowRight size={16} />
          הקודם
        </button>
        {step < 4 ? (
          <button
            type="button"
            disabled={busy || (step === 1 && !draft.articleId)}
            onClick={() => setStep((s) => (Math.min(4, s + 1) as Step))}
            className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-base disabled:opacity-50 hover:opacity-90"
          >
            המשך
            <ArrowLeft size={16} />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveAndPublish(false)}
              className="rounded-md border border-border px-4 py-2 text-base hover:bg-muted disabled:opacity-50"
            >
              שמור טיוטה
            </button>
            <button
              type="button"
              disabled={busy || !draft.title.trim()}
              onClick={() => void saveAndPublish(true)}
              className="rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-base font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="inline animate-spin" size={16} /> מפרסם…
                </>
              ) : (
                "פרסם"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const items = ["קובץ", "פרטים", "קטגוריות", "תצוגה מקדימה"];
  return (
    <ol className="flex items-center gap-3 overflow-x-auto">
      {items.map((label, i) => {
        const n = (i + 1) as Step;
        const active = n === step;
        const done = n < step;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : done
                ? "border-accent text-accent-foreground bg-accent/15"
                : "border-border text-muted-foreground"
            }`}
          >
            <span className="font-bold">{n}.</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

function StepFile({
  onUpload,
  busy,
  current,
}: {
  onUpload: (f: File) => void;
  busy: boolean;
  current: string;
}) {
  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-2">העלאת קובץ Word</h2>
      <p className="text-muted-foreground mb-6">
        מומלץ להעלות קובץ <code>.docx</code>. קבצי <code>.doc</code> ישנים יומרו
        אוטומטית אם השירות מוגדר.
      </p>
      <label className="block cursor-pointer rounded-lg border-2 border-dashed border-border bg-muted/30 p-10 hover:bg-muted/60">
        <Upload size={36} className="mx-auto mb-3 text-muted-foreground" />
        <span className="block text-base font-medium">
          לחץ כאן או גרור קובץ Word
        </span>
        <input
          type="file"
          accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
          }}
        />
      </label>
      {current && (
        <p className="mt-4 text-sm text-muted-foreground">
          קובץ נוכחי: <strong>{current}</strong>
        </p>
      )}
      {busy && (
        <p className="mt-4 text-sm text-muted-foreground">מעלה ומבצע המרה…</p>
      )}
    </div>
  );
}

function StepDetails({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
}) {
  return (
    <div className="space-y-5">
      <Field label="כותרת המאמר">
        <input
          className="input"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
        />
      </Field>
      <Field label="תיאור קצר">
        <textarea
          className="input"
          rows={3}
          value={draft.description}
          onChange={(e) =>
            setDraft((d) => ({ ...d, description: e.target.value }))
          }
        />
      </Field>
      <Field
        label="תקופה ורקע"
        hint="למשל: שנות התשעים, ירושלים, לאחר אירועים…"
      >
        <textarea
          className="input"
          rows={3}
          value={draft.periodAndContext}
          onChange={(e) =>
            setDraft((d) => ({ ...d, periodAndContext: e.target.value }))
          }
        />
      </Field>
      <Field label="תאריך כתיבה מקורי (אופציונלי)">
        <input
          type="date"
          className="input"
          value={draft.writtenAt}
          onChange={(e) =>
            setDraft((d) => ({ ...d, writtenAt: e.target.value }))
          }
        />
      </Field>
      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.4rem;
          border: 1px solid hsl(var(--input));
          background: hsl(var(--background));
          font-size: 1.05rem;
        }
        .input:focus {
          outline: 2px solid hsl(var(--ring));
        }
      `}</style>
    </div>
  );
}

function StepCategory({
  categories,
  selected,
  onChange,
}: {
  categories: Category[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  function toggle(id: number) {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else onChange([...selected, id]);
  }
  if (categories.length === 0) {
    return (
      <p className="text-muted-foreground">
        אין עדיין קטגוריות. ביקש מהמנהל להוסיף קטגוריה ראשונה.
      </p>
    );
  }
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">בחירת קטגוריה</h2>
      <p className="text-muted-foreground mb-4">ניתן לבחור יותר מאחת.</p>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            type="button"
            key={c.id}
            onClick={() => toggle(c.id)}
            className={`rounded-full px-4 py-2 border text-base ${
              selected.includes(c.id)
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            {c.nameHe}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepPreview({
  draft,
  categories,
}: {
  draft: Draft;
  categories: Category[];
}) {
  const cats = categories.filter((c) => draft.categoryIds.includes(c.id));
  return (
    <article className="prose-article">
      <h2 className="text-3xl font-bold">{draft.title || "(ללא כותרת)"}</h2>
      {draft.description && (
        <p className="text-lg text-muted-foreground">{draft.description}</p>
      )}
      {(draft.periodAndContext || draft.writtenAt) && (
        <aside className="my-6 rounded-md border-s-4 border-accent bg-muted/40 px-4 py-3">
          <div className="text-sm font-semibold uppercase text-muted-foreground">
            תקופה ורקע
          </div>
          {draft.periodAndContext && (
            <p className="mt-1 whitespace-pre-line">{draft.periodAndContext}</p>
          )}
          {draft.writtenAt && (
            <p className="mt-1 text-sm text-muted-foreground">
              תאריך כתיבה: {draft.writtenAt}
            </p>
          )}
        </aside>
      )}
      {cats.length > 0 && (
        <p className="text-sm text-muted-foreground">
          קטגוריות: {cats.map((c) => c.nameHe).join(" · ")}
        </p>
      )}
      <hr className="my-6" />
      <div dangerouslySetInnerHTML={{ __html: draft.bodyHtml }} />
    </article>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-base font-medium mb-1">{label}</span>
      {hint && (
        <span className="block text-sm text-muted-foreground mb-1">{hint}</span>
      )}
      {children}
    </label>
  );
}
