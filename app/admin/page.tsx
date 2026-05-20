import { count, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  articles,
  comments,
  jobs,
  users,
} from "@/lib/db/schema";

export default async function AdminHome() {
  const [arts] = await db
    .select({
      total: count(),
      published: sql<number>`count(*) filter (where ${articles.status} = 'published')`,
      drafts: sql<number>`count(*) filter (where ${articles.status} = 'draft')`,
    })
    .from(articles);

  const [comms] = await db
    .select({
      total: count(),
      reported: sql<number>`count(*) filter (where ${comments.reportCount} > 0)`,
    })
    .from(comments);

  const [usrs] = await db
    .select({
      total: count(),
      authors: sql<number>`count(*) filter (where ${users.role} = 'author')`,
      admins: sql<number>`count(*) filter (where ${users.role} = 'admin')`,
    })
    .from(users);

  const [jbs] = await db
    .select({
      queued: sql<number>`count(*) filter (where ${jobs.status} = 'queued')`,
      running: sql<number>`count(*) filter (where ${jobs.status} = 'running')`,
      error: sql<number>`count(*) filter (where ${jobs.status} = 'error')`,
    })
    .from(jobs);

  const tiles: Array<{ label: string; value: number | string }> = [
    { label: "מאמרים מפורסמים", value: arts.published ?? 0 },
    { label: "טיוטות", value: arts.drafts ?? 0 },
    { label: 'סה"כ תגובות', value: comms.total ?? 0 },
    { label: "תגובות מדווחות", value: comms.reported ?? 0 },
    { label: "משתמשים רשומים", value: usrs.total ?? 0 },
    { label: "כותבים", value: usrs.authors ?? 0 },
    { label: "אדמינים", value: usrs.admins ?? 0 },
    { label: "Jobs בתור", value: jbs.queued ?? 0 },
    { label: "Jobs בשגיאה", value: jbs.error ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">סקירה</h1>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-md border border-border bg-card p-4"
          >
            <div className="text-3xl font-semibold">{t.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
