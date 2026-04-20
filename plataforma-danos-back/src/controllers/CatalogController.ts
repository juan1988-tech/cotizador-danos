import { Request, Response, NextFunction } from 'express';
import { ExternalCoreService } from '../services/ExternalCoreService';
import { ValidationError } from '../utils/errors';

const coreService = new ExternalCoreService();

export async function getAgents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const result = await coreService.getAgents(q);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSubscribers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const result = await coreService.getSubscribers(q);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ── GET /api/v1/catalogs/giros ────────────────────────────────────────────────

export async function getGiros(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const result = await coreService.getGiros(q);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ── GET /api/v1/catalogs/postal-codes/:cp ─────────────────────────────────────

export async function getPostalCode(
  req: Request<{ cp: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { cp } = req.params;
    if (!cp || cp.length < 3) {
      throw new ValidationError('El código postal debe tener al menos 3 caracteres.', {
        field: 'cp',
        value: cp,
      });
    }
    const result = await coreService.validatePostalCode(cp);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}
