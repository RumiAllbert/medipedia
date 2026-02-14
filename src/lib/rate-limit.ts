type Bucket = {
  count: number;
  resetAt: number;
};

const globalState = globalThis as unknown as {
  medipediaRateLimit?: Map<string, Bucket>;
};

const store = globalState.medipediaRateLimit ?? new Map<string, Bucket>();
if (!globalState.medipediaRateLimit) {
  globalState.medipediaRateLimit = store;
}

export function rateLimit(params: {
  key: string;
  max: number;
  windowMs: number;
}): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = store.get(params.key);

  if (!bucket || bucket.resetAt <= now) {
    const next = {
      count: 1,
      resetAt: now + params.windowMs,
    };
    store.set(params.key, next);
    return {
      allowed: true,
      remaining: Math.max(0, params.max - 1),
      resetAt: next.resetAt,
    };
  }

  if (bucket.count >= params.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.resetAt,
    };
  }

  bucket.count += 1;
  store.set(params.key, bucket);
  return {
    allowed: true,
    remaining: Math.max(0, params.max - bucket.count),
    resetAt: bucket.resetAt,
  };
}

export function requestIdentity(request: Request, userId?: string): string {
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return `${userId ?? "anon"}:${ip}`;
}
