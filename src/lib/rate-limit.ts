import "server-only";

import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const entries = new Map<string, RateLimitEntry>();
const distributedLimiters = new Map<string, Ratelimit>();

function distributedLimiter(scope: string, limit: number, windowMs: number): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  const key = `${scope}:${limit}:${windowMs}`;
  const existing = distributedLimiters.get(key);
  if (existing) return existing;
  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
    analytics: false,
    prefix: "jazyshouse:ratelimit",
  });
  distributedLimiters.set(key, limiter);
  return limiter;
}

/**
 * Uses Upstash Redis in deployed environments so all serverless instances share
 * counters. Local development uses a short-lived in-memory fallback.
 */
export async function assertRateLimit(
  scope: string,
  limit: number,
  windowMs: number,
): Promise<void> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const client = forwarded?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";
  const key = `${scope}:${client}`;
  const limiter = distributedLimiter(scope, limit, windowMs);
  if (limiter) {
    const result = await limiter.limit(client);
    if (!result.success) throw new Error("Too many requests. Please wait and try again.");
    return;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Rate limiting is not configured.");
  }
  const now = Date.now();
  const current = entries.get(key);

  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) {
    throw new Error("Too many requests. Please wait and try again.");
  }
  current.count += 1;
}
