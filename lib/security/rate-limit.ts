/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding-window counter per IP. Since this runs in a single
 * Node.js process, the counter is local — adequate for self-hosted
 * Next.js. For serverless deployments, replace with a DB-backed or
 * external rate-limiter (e.g. Upstash).
 *
 * Usage:
 *   const rl = rateLimit({ max: 10, windowMs: 60_000 });  // 10 req/min
 *   const result = rl.check(request);
 *   if (!result.allowed) {
 *     return NextResponse.json({ error: "rate_limit" }, { status: 429 });
 *   }
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const counters = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  max: number;       // max requests in the window
  windowMs: number;  // window duration in ms
  label?: string;    // optional label for log output
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(config: RateLimitConfig) {
  const { max, windowMs, label } = config;

  return {
    check(request: { headers: Headers | Record<string, string | undefined> }): RateLimitResult {
      const forwarded = "headers" in request
        ? (request.headers as Headers).get("x-forwarded-for")
        : null;
      const ip = forwarded?.split(",")[0]?.trim()
        ?? (typeof request.headers === "object" && !(request.headers instanceof Headers)
          ? (request.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
          : null)
        ?? "unknown";
      const key = `${label ?? "rl"}:${ip}`;

      const now = Date.now();
      let entry = counters.get(key);

      if (!entry || now > entry.resetAt) {
        counters.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
      }

      entry.count++;

      if (entry.count > max) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
      }

      return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
    },
  };
}
