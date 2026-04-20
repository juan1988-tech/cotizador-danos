import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/**
 * Global error handler — converts AppError subclasses to structured JSON
 * responses and catches unexpected errors without leaking internal details
 * (LIN-DEV-003: error messages must not reveal stack traces or internal paths).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error:   err.errorCode,
      message: err.message,
      ...(err.details !== undefined && { details: err.details }),
    });
    return;
  }

  // Unexpected error — log internally but never expose to client
  console.error('[errorHandler] Unexpected error:', err);
  res.status(500).json({
    error:   'InternalServerError',
    message: 'An unexpected error occurred.',
  });
}
