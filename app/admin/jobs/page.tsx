import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { formatHebrewDate } from "@/lib/utils/dates";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const rows = await db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.createdAt))
    .limit(100);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">עבודות רקע</h1>
      <p className="text-sm text-muted-foreground">
        רץ אוטומטית כל דקה דרך Vercel Cron. ניתן להפעיל ידנית מהממשק.
      </p>
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start p-3">סוג</th>
              <th className="text-start p-3">סטטוס</th>
              <th className="text-start p-3">ניסיונות</th>
              <th className="text-start p-3">שגיאה אחרונה</th>
              <th className="text-start p-3">נוצר</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((j) => (
              <tr key={j.id} className="border-t border-border">
                <td className="p-3">{j.kind}</td>
                <td className="p-3">
                  <Status status={j.status} />
                </td>
                <td className="p-3">{j.attempts}</td>
                <td className="p-3 text-xs text-destructive truncate max-w-sm">
                  {j.lastError ?? "—"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {formatHebrewDate(j.createdAt)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-muted-foreground">
                  אין עבודות.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Status({ status }: { status: string }) {
  const map: Record<string, string> = {
    queued: "bg-muted text-foreground",
    running: "bg-amber-100 text-amber-900",
    done: "bg-emerald-100 text-emerald-900",
    error: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}
