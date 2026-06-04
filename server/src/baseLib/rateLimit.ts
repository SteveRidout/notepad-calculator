import express from "express";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  key?: (req: express.Request) => string;
  skip?: (req: express.Request) => boolean;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const records = new Map<string, RateLimitRecord>();

const defaultKey = (req: express.Request) => req.ip || "unknown";

export const rateLimit = ({
  windowMs,
  maxRequests,
  keyPrefix,
  key = defaultKey,
  skip,
}: RateLimitOptions): express.RequestHandler => {
  return (req, res, next) => {
    if (skip?.(req)) {
      next();
      return;
    }

    const now = Date.now();
    const mapKey = `${keyPrefix}:${key(req)}`;
    const existing = records.get(mapKey);
    const record =
      existing === undefined || existing.resetTime <= now
        ? { count: 0, resetTime: now + windowMs }
        : existing;

    record.count += 1;
    records.set(mapKey, record);

    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader("RateLimit-Limit", maxRequests.toString());
    res.setHeader("RateLimit-Remaining", Math.max(0, maxRequests - record.count).toString());
    res.setHeader("RateLimit-Reset", retryAfterSeconds.toString());

    if (record.count > maxRequests) {
      res.setHeader("Retry-After", retryAfterSeconds.toString());
      res.status(429).send("Too many requests. Please try again later.");
      return;
    }

    if (records.size > 10000) {
      for (const [key, value] of records.entries()) {
        if (value.resetTime <= now) {
          records.delete(key);
        }
      }
    }

    next();
  };
};
