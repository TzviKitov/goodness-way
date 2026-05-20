import { NextResponse } from "next/server";
import { runDueJobs } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runDueJobs();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[cron] failed", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
