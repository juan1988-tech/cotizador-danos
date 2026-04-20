import rateLimit from 'express-rate-limit';

/**
 * General API limiter — applied to all /api/v1 routes.
 * 100 requests per 15-minute window per IP.
 * Exposes standard X-RateLimit-* headers (LIN-DEV-010: Rate Limiting).
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests from this IP. Please try again in 15 minutes.',
  },
});

/**
 * Strict limiter for sensitive endpoints (e.g. auth, password reset).
 * 5 requests per 15-minute window per IP, skipping successful responses.
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: 'TooManyRequests',
    message: 'Too many attempts from this IP. Please try again in 15 minutes.',
  },
});
