// Placeholder token-bucket in-memory limiter (replace with durable store in prod)
const buckets = new Map<string, { tokens: number; ts: number }>();

export function rateLimit(key: string, limit = 60, refillPerSec = 1): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: limit, ts: now };
  const delta = (now - b.ts) / 1000;
  b.tokens = Math.min(limit, b.tokens + delta * refillPerSec);
  b.ts = now;
  if (b.tokens < 1) { buckets.set(key, b); return false; }
  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}