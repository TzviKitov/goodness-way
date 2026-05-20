import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimiterKind = "comment" | "search" | "llm" | "auth";

const memoryStore = new Map<string, { count: number; expires: number }>();

function getUpstashLimiter(kind: LimiterKind): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  const limits: Record<LimiterKind, { limit: number; windowSec: number }> = {
    comment: { limit: 10, windowSec: 60 },
    search: { limit: 60, windowSec: 60 },
    llm: { limit: 20, windowSec: 60 },
    auth: { limit: 30, windowSec: 60 },
  };
  const cfg = limits[kind];
  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(cfg.limit, `${cfg.windowSec} s`),
    prefix: `rl:${kind}`,
  });
}

export async function rateLimit(
  kind: LimiterKind,
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  const upstash = getUpstashLimiter(kind);
  if (upstash) {
    const res = await upstash.limit(identifier);
    return { success: res.success, remaining: res.remaining };
  }
  return inMemoryLimit(kind, identifier);
}

function inMemoryLimit(
  kind: LimiterKind,
  identifier: string
): { success: boolean; remaining: number } {
  const config: Record<LimiterKind, { limit: number; windowMs: number }> = {
    comment: { limit: 10, windowMs: 60_000 },
    search: { limit: 60, windowMs: 60_000 },
    llm: { limit: 20, windowMs: 60_000 },
    auth: { limit: 30, windowMs: 60_000 },
  };
  const { limit, windowMs } = config[kind];
  const key = `${kind}:${identifier}`;
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || entry.expires < now) {
    memoryStore.set(key, { count: 1, expires: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }
  entry.count += 1;
  return { success: true, remaining: limit - entry.count };
}
