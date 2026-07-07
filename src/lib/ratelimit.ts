import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Only instantiate when env vars exist (avoids build errors in CI / local without Redis)
const redis =
  process.env.UPSTASH_REDIS_REST_URL
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
    : null;

/** 20 requests per 10 seconds per identifier — for search endpoints */
export const searchRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "10 s"),
      prefix: "pf:search",
    })
  : null;

/** 10 requests per minute — for post / comment creation */
export const postRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      prefix: "pf:post",
    })
  : null;

/** 5 challenges per minute per user */
export const challengeRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: "pf:challenge",
    })
  : null;
