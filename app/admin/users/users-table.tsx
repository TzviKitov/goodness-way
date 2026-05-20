"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatHebrewDate } from "@/lib/utils/dates";

type Role = "reader" | "author" | "admin";

type U = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
};

export function UsersTable({ users }: { users: U[] }) {
  const [list, setList] = useState(users);
  const [pending, startBusy] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  function setRole(id: string, role: Role) {
    setErr(null);
    startBusy(async () => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data?.error ?? "שגיאה");
        return;
      }
      setList((l) => l.map((u) => (u.id === id ? { ...u, role } : u)));
      router.refresh();
    });
  }

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      {err && <p className="px-4 py-2 text-sm text-destructive">{err}</p>}
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-start p-3">שם</th>
            <th className="text-start p-3">אימייל</th>
            <th className="text-start p-3">תפקיד</th>
            <th className="text-start p-3">תאריך הצטרפות</th>
          </tr>
        </thead>
        <tbody>
          {list.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="p-3">{u.name || "—"}</td>
              <td className="p-3 text-muted-foreground">{u.email}</td>
              <td className="p-3">
                <select
                  value={u.role}
                  disabled={pending}
                  onChange={(e) => setRole(u.id, e.target.value as Role)}
                  className="rounded-md border border-input bg-background px-2 py-1"
                >
                  <option value="reader">קורא</option>
                  <option value="author">כותב</option>
                  <option value="admin">אדמין</option>
                </select>
              </td>
              <td className="p-3 text-muted-foreground">
                {formatHebrewDate(u.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
