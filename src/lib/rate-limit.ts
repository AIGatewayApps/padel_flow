/**
 * Lightweight in-memory rate limiter for edge/serverless routes.
 * For high-traffic production use, swap the store for Upstash Redis:
 * https://github.com/upstash/ratelimit
 *
 * Usage:
 *   const result = await rateLimit(req, { limit: 10, window: 60 });
 *   if (!result.success) return new Response("Too many requests", { status: 429 });
 */

const store = new Map<string, { count: number; reset: number }>();

interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window size in seconds */
  window: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export function rateLimit(
  key: string,
  { limit, window }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const windowMs = window * 1000;

  const entry = store.get(key);

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  entry.count++;

  if (entry.count > limit) {
    return { success: false, limit, remaining: 0, reset: entry.reset };
  }

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.reset,
  };
}

/** Extract the best available identifier from a Request */
export function getRateLimitKey(req: Request, prefix: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${prefix}:${ip}`;
}
