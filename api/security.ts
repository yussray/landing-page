const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const buckets = new Map<string, { count: number; resetAt: number }>();

export const MAX_BODY_BYTES = 24_000;

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";

  if (!origin || !host) return false;

  try {
    const originUrl = new URL(origin);
    const expectedOrigin = `${protocol}://${host}`;
    const requestHostname = host.split(":")[0];
    const isLocalRequest =
      requestHostname === "localhost" || requestHostname === "127.0.0.1";
    const isSameLocalHost =
      isLocalRequest &&
      (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1");

    return origin === expectedOrigin || isSameLocalHost;
  } catch {
    return false;
  }
}

export function checkRateLimit(identifier: string, now = Date.now()) {
  const current = buckets.get(identifier);

  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(identifier, next);
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, ...next };
  }

  current.count += 1;
  return {
    allowed: current.count <= MAX_REQUESTS_PER_WINDOW,
    remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - current.count),
    ...current,
  };
}

export function getClientIdentifier(request: Request) {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
