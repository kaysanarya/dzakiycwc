import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  reason?: "IP_LIMIT_EXCEEDED" | "GLOBAL_LIMIT_EXCEEDED";
}

interface InMemoryBucket {
  used: number;
  resetAt: number;
}

const inMemoryIpBuckets = new Map<string, InMemoryBucket>();
let inMemoryGlobalBucket: InMemoryBucket = { used: 0, resetAt: 0 };
let hasLoggedServerlessWarning = false;

function getNextResetUtc(): number {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
}

export function getQuotaLimits(): { perIpLimit: number; globalLimit: number } {
  const perIpEnv = process.env.DEMO_LIMIT_PER_IP;
  const globalEnv = process.env.DEMO_LIMIT_GLOBAL;
  const perIpLimit = perIpEnv ? Math.max(1, parseInt(perIpEnv, 10) || 3) : 3;
  const globalLimit = globalEnv ? Math.max(1, parseInt(globalEnv, 10) || 100) : 100;
  return { perIpLimit, globalLimit };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  const first = forwarded.split(",")[0]?.trim();
  return first || "unknown";
}

let cachedRedis: Redis | null = null;
let cachedIpLimiter: Ratelimit | null = null;
let cachedGlobalLimiter: Ratelimit | null = null;

function getUpstashLimiters(perIpLimit: number, globalLimit: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) return null;

  if (!cachedRedis) {
    cachedRedis = new Redis({ url, token });
  }

  if (!cachedIpLimiter) {
    cachedIpLimiter = new Ratelimit({
      redis: cachedRedis,
      limiter: Ratelimit.fixedWindow(perIpLimit, "1 d"),
      prefix: "vellum:quota:ip",
    });
  }

  if (!cachedGlobalLimiter) {
    cachedGlobalLimiter = new Ratelimit({
      redis: cachedRedis,
      limiter: Ratelimit.fixedWindow(globalLimit, "1 d"),
      prefix: "vellum:quota:global",
    });
  }

  return { ipLimiter: cachedIpLimiter, globalLimiter: cachedGlobalLimiter };
}

/**
 * Check and consume demo quota for server key executions.
 * BYOK requests do NOT call this function.
 * @param req The incoming Request
 * @param cost Cost of operation (e.g. 0 for analyze, 1 per image for generate)
 */
export async function checkAndConsumeDemoQuota(
  req: Request,
  cost: number = 1
): Promise<QuotaCheckResult> {
  const ip = getClientIp(req);
  const { perIpLimit, globalLimit } = getQuotaLimits();
  const limiters = getUpstashLimiters(perIpLimit, globalLimit);

  // Upstash Redis branch
  if (limiters) {
    try {
      const nextReset = getNextResetUtc();

      if (cost <= 0) {
        const ipRem = await limiters.ipLimiter.getRemaining(ip);
        const globRem = await limiters.globalLimiter.getRemaining("global");
        const remaining = Math.max(0, Math.min(ipRem.remaining, globRem.remaining));
        const allowed = ipRem.remaining > 0 && globRem.remaining > 0;
        return {
          allowed,
          remaining,
          limit: perIpLimit,
          resetAt: ipRem.reset ? ipRem.reset : nextReset,
          reason: ipRem.remaining <= 0 ? "IP_LIMIT_EXCEEDED" : globRem.remaining <= 0 ? "GLOBAL_LIMIT_EXCEEDED" : undefined,
        };
      }

      // Consume tokens
      const [ipRes, globRes] = await Promise.all([
        limiters.ipLimiter.limit(ip, { rate: cost }),
        limiters.globalLimiter.limit("global", { rate: cost }),
      ]);

      if (!ipRes.success) {
        return {
          allowed: false,
          remaining: 0,
          limit: perIpLimit,
          resetAt: ipRes.reset || nextReset,
          reason: "IP_LIMIT_EXCEEDED",
        };
      }

      if (!globRes.success) {
        return {
          allowed: false,
          remaining: 0,
          limit: perIpLimit,
          resetAt: globRes.reset || nextReset,
          reason: "GLOBAL_LIMIT_EXCEEDED",
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, ipRes.remaining),
        limit: perIpLimit,
        resetAt: ipRes.reset || nextReset,
      };
    } catch (upstashErr: unknown) {
      console.warn("[Quota] Upstash connection failed, falling back to in-memory:", upstashErr);
    }
  }

  // In-Memory Fallback
  if (!hasLoggedServerlessWarning) {
    console.warn(
      "[Quota] Warning: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not configured. Falling back to in-memory rate limiting, which is not synchronized across serverless instances."
    );
    hasLoggedServerlessWarning = true;
  }

  const now = Date.now();
  const nextReset = getNextResetUtc();

  // Reset global bucket if day passed
  if (now >= inMemoryGlobalBucket.resetAt) {
    inMemoryGlobalBucket = { used: 0, resetAt: nextReset };
  }

  // Get or initialize IP bucket
  let ipBucket = inMemoryIpBuckets.get(ip);
  if (!ipBucket || now >= ipBucket.resetAt) {
    ipBucket = { used: 0, resetAt: nextReset };
    inMemoryIpBuckets.set(ip, ipBucket);
  }

  // If cost is 0 (read-only quota check e.g. /api/analyze)
  if (cost <= 0) {
    const isIpExceeded = ipBucket.used >= perIpLimit;
    const isGlobalExceeded = inMemoryGlobalBucket.used >= globalLimit;
    const remaining = Math.max(0, perIpLimit - ipBucket.used);

    return {
      allowed: !isIpExceeded && !isGlobalExceeded,
      remaining,
      limit: perIpLimit,
      resetAt: ipBucket.resetAt,
      reason: isIpExceeded ? "IP_LIMIT_EXCEEDED" : isGlobalExceeded ? "GLOBAL_LIMIT_EXCEEDED" : undefined,
    };
  }

  // Check if adding cost exceeds limit
  if (ipBucket.used + cost > perIpLimit) {
    return {
      allowed: false,
      remaining: Math.max(0, perIpLimit - ipBucket.used),
      limit: perIpLimit,
      resetAt: ipBucket.resetAt,
      reason: "IP_LIMIT_EXCEEDED",
    };
  }

  if (inMemoryGlobalBucket.used + cost > globalLimit) {
    return {
      allowed: false,
      remaining: Math.max(0, perIpLimit - ipBucket.used),
      limit: perIpLimit,
      resetAt: inMemoryGlobalBucket.resetAt,
      reason: "GLOBAL_LIMIT_EXCEEDED",
    };
  }

  // Deduct
  ipBucket.used += cost;
  inMemoryGlobalBucket.used += cost;
  const remaining = Math.max(0, perIpLimit - ipBucket.used);

  return {
    allowed: true,
    remaining,
    limit: perIpLimit,
    resetAt: ipBucket.resetAt,
  };
}

export function createQuotaExceededResponse(result: QuotaCheckResult): NextResponse {
  const retryAfterSec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return NextResponse.json(
    {
      code: "DEMO_QUOTA_EXCEEDED",
      error: "Batas kuota demo harian telah tercapai. Harap gunakan API key Anda sendiri (BYOK) untuk melanjutkan tanpa batas.",
      resetAt: result.resetAt,
      limit: result.limit,
      remaining: 0,
    },
    {
      status: 429,
      headers: {
        "x-demo-remaining": "0",
        "Retry-After": retryAfterSec.toString(),
      },
    }
  );
}

/**
 * Reset in-memory quota tracking (used for tests)
 */
export function _resetInMemoryQuotaForTesting(): void {
  inMemoryIpBuckets.clear();
  inMemoryGlobalBucket = { used: 0, resetAt: 0 };
}
