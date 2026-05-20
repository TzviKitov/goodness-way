"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Trash2, Plus, Loader2 } from "lucide-react";

type Cat = {
  id: number;
  slug: string;
  nameHe: string;
  description: string;
  displayOrder: number;
};

export function CategoriesEditor({ initial }: { initial: Cat[] }) {
  const [list, setList] = useState<Cat[]>(initial);
  const [busy, startBusy] = useTransition();
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  function move(idx: number, dir: -1 | 1) {
    const next = [...list];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setList(next.map((c, i) => ({ ...c, displayOrder: i })));
  }

  async function saveOrder() {
    setErr(null);
    startBusy(async () => {
      const res = await fetch("/api/admin/categories/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ids: list.map((c) => c.id),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data?.error ?? "שמירה נכשלה");
      } else router.refresh();
    });
  }

  async function add() {
    setErr(null);
    if (!name.trim()) return;
    startBusy(async () => {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nameHe: name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data?.error ?? "הוספה נכשלה");
        return;
      }
      setList((l) => [
        ...l,
        {
          id: data.id,
          slug: data.slug,
          nameHe: data.nameHe,
          description: "",
          displayOrder: l.length,
        },
      ]);
      setName("");
      router.refresh();
    });
  }

  async function remove(id: number) {
    if (!confirm("למחוק קטגוריה?")) return;
    startBusy(async () => {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setList((l) => l.filter((c) => c.id !== id));
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card p-4 flex gap-2">
        <input
          className="flex-1 rounded-md border border-input bg-background px-3 py-2"
          placeholder="שם קטגוריה חדשה (עברית)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={add}
          className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-4 py-2 disabled:opacity-50"
        >
          <Plus size={16} />
          הוסף
        </button>
      </div>
      {err && <p className="text-destructive text-sm">{err}</p>}
      <ul className="rounded-md border border-border bg-card divide-y divide-border">
        {list.map((c, idx) => (
          <li key={c.id} className="flex items-center gap-2 p-3">
            <span className="w-8 text-muted-foreground text-sm">
              {idx + 1}.
            </span>
            <span className="flex-1">
              {c.nameHe}{" "}
              <span className="text-xs text-muted-foreground">/{c.slug}</span>
            </span>
            <button
              type="button"
              onClick={() => move(idx, -1)}
              className="p-1 hover:bg-muted rounded"
              aria-label="העלה"
            >
              <ArrowUp size={16} />
            </button>
            <button
              type="button"
              onClick={() => move(idx, 1)}
              className="p-1 hover:bg-muted rounded"
              aria-label="הורד"
            >
              <ArrowDown size={16} />
            </button>
            <button
              type="button"
              onClick={() => remove(c.id)}
              className="p-1 hover:bg-destructive/10 text-destructive rounded"
              aria-label="מחק"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
        {list.length === 0 && (
          <li className="p-4 text-muted-foreground text-sm">אין עדיין קטגוריות.</li>
        )}
      </ul>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={saveOrder}
          className="rounded-md border border-border px-4 py-2 hover:bg-muted disabled:opacity-50 inline-flex items-center gap-1"
        >
          {busy && <Loader2 size={14} className="animate-spin" />} שמור סדר
        </button>
      </div>
    </div>
  );
}
