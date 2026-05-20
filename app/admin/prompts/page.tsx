import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { llmPrompts } from "@/lib/db/schema";
import { defaultPrompts } from "@/lib/llm";

export const dynamic = "force-dynamic";

export default async function PromptsPage() {
  const rows = await db
    .select()
    .from(llmPrompts)
    .orderBy(desc(llmPrompts.kind), desc(llmPrompts.version));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">פרומפטים</h1>
      <p className="text-muted-foreground text-sm">
        אם אין פרומפט פעיל לסוג מסוים, המערכת משתמשת בפרומפט ברירת המחדל למטה.
        עריכת פרומפטים והוספת גרסה חדשה תתווסף בשלב הבא של הפיתוח.
      </p>
      <section>
        <h2 className="text-xl font-semibold mb-3">פרומפטים פעילים במסד</h2>
        {rows.length === 0 ? (
          <p className="text-muted-foreground">אין עדיין פרומפטים שמורים.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((p) => (
              <li
                key={p.id}
                className="rounded-md border border-border bg-card p-4"
              >
                <header className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {p.kind} — v{p.version}{" "}
                    {p.isActive && (
                      <span className="ms-2 text-xs rounded-full bg-emerald-100 text-emerald-900 px-2 py-0.5">
                        פעיל
                      </span>
                    )}
                  </span>
                </header>
                <pre className="mt-2 whitespace-pre-wrap text-sm bg-muted/40 p-3 rounded">
                  {p.promptText}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-3">ברירת מחדל בקוד</h2>
        <ul className="space-y-3">
          {(Object.entries(defaultPrompts) as Array<[string, string]>).map(
            ([k, text]) => (
              <li
                key={k}
                className="rounded-md border border-border bg-card p-4"
              >
                <h3 className="font-medium">{k}</h3>
                <pre className="mt-2 whitespace-pre-wrap text-sm bg-muted/40 p-3 rounded">
                  {text}
                </pre>
              </li>
            )
          )}
        </ul>
      </section>
    </div>
  );
}
