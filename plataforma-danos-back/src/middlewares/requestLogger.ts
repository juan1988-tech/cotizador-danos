import { Request, Response, NextFunction } from 'express';

/**
 * Structured request/response logger.
 * Logs method, URL, status code, response time, and client IP.
 * PII-safe: request body and auth headers are never logged (LIN-DEV-003).
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? 'unknown',
    };

    if (res.statusCode >= 500) {
      console.error('[HTTP]', JSON.stringify(logEntry));
    } else if (res.statusCode >= 400) {
      console.warn('[HTTP]', JSON.stringify(logEntry));
    } else {
      console.log('[HTTP]', JSON.stringify(logEntry));
    }
  });

  next();
}
