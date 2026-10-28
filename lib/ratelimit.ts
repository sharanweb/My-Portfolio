import "server-only";

// Best-effort, per-instance limiter. On serverless each instance keeps its own window,
// which is enough to stop casual spam; use Upstash Ratelimit if you need a global limit.
const hits = new Map<string, number[]>();

export function rateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return list.length > limit;
}

export function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}
