import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// En desarrollo, usar Map en memoria
// En producción, usar Upstash Redis
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

/**
 * Rate limiter for redirect requests
 * 100 requests per minute per IP
 */
export const redirectRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        analytics: true,
    })
    : null;

/**
 * Rate limiter for API requests
 * 30 requests per minute per user/IP
 */
export const apiRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "1 m"),
        analytics: true,
    })
    : null;

/**
 * Rate limiter for password verification attempts
 * 5 attempts per minute per link to prevent brute force
 */
export const passwordVerifyRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        analytics: true,
    })
    : null;
