"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  categories: Array<{ slug: string; nameHe: string }>;
  values: {
    query?: string;
    categorySlug?: string;
    period?: string;
    writtenFrom?: string;
    writtenTo?: string;
    publishedFrom?: string;
    publishedTo?: string;
  };
};

export function AdvancedFilters({ categories, values }: Props) {
  const t = useTranslations("search");
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({
    category: values.categorySlug ?? "",
    period: values.period ?? "",
    wfrom: values.writtenFrom ?? "",
    wto: values.writtenTo ?? "",
    pfrom: values.publishedFrom ?? "",
    pto: values.publishedTo ?? "",
  });

  function apply() {
    const next = new URLSearchParams(sp?.toString() ?? "");
    next.delete("page");
    setOrDelete(next, "category", state.category);
    setOrDelete(next, "period", state.period);
    setOrDelete(next, "wfrom", state.wfrom);
    setOrDelete(next, "wto", state.wto);
    setOrDelete(next, "pfrom", state.pfrom);
    setOrDelete(next, "pto", state.pto);
    router.push(`/search?${next.toString()}`);
  }

  return (
    <div className="border border-border rounded-md">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{t("advanced")}</span>
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="p-4 grid gap-4 md:grid-cols-2 border-t border-border">
          <Field label={t("filterCategory")}>
            <select
              className="input"
              value={state.category}
              onChange={(e) => setState((s) => ({ ...s, category: e.target.value }))}
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nameHe}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("filterPeriod")}>
            <input
              className="input"
              value={state.period}
              onChange={(e) => setState((s) => ({ ...s, period: e.target.value }))}
              placeholder="למשל: ירושלים"
            />
          </Field>
          <Field label={t("filterWrittenFrom")}>
            <input
              type="date"
              className="input"
              value={state.wfrom}
              onChange={(e) => setState((s) => ({ ...s, wfrom: e.target.value }))}
            />
          </Field>
          <Field label={t("filterWrittenTo")}>
            <input
              type="date"
              className="input"
              value={state.wto}
              onChange={(e) => setState((s) => ({ ...s, wto: e.target.value }))}
            />
          </Field>
          <Field label={t("filterPublishedFrom")}>
            <input
              type="date"
              className="input"
              value={state.pfrom}
              onChange={(e) => setState((s) => ({ ...s, pfrom: e.target.value }))}
            />
          </Field>
          <Field label={t("filterPublishedTo")}>
            <input
              type="date"
              className="input"
              value={state.pto}
              onChange={(e) => setState((s) => ({ ...s, pto: e.target.value }))}
            />
          </Field>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="button"
              onClick={apply}
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              {t("submit")}
            </button>
          </div>
        </div>
      )}
      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          border: 1px solid hsl(var(--input));
          background: hsl(var(--background));
        }
        .input:focus {
          outline: 2px solid hsl(var(--ring));
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
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function setOrDelete(p: URLSearchParams, key: string, value: string) {
  if (value) p.set(key, value);
  else p.delete(key);
}
