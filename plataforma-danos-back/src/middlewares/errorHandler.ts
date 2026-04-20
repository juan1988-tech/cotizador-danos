import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      error: err.errorCode,
      message: err.message,
    };
    if (err.details !== undefined) {
      body.details = err.details;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  // Unexpected errors — never expose internals
  res.status(500).json({
    error: 'InternalServerError',
    message: 'Ha ocurrido un error inesperado. Intente nuevamente.',
  });
}
