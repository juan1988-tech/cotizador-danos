import { Request, Response, NextFunction } from 'express';
import { ExternalCoreService } from '../services/ExternalCoreService';

const externalCore = new ExternalCoreService();

// ── GET /catalogs/agents ──────────────────────────────────────────────────────
export async function getAgents(
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: proxy to Plataforma-core-ohs /agents, support ?q filter
    next(new Error('getAgents not yet implemented'));
  } catch (err) {
    next(err);
  }
}

// ── GET /catalogs/subscribers ─────────────────────────────────────────────────
export async function getSubscribers(
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: proxy to Plataforma-core-ohs /subscribers, support ?q filter
    next(new Error('getSubscribers not yet implemented'));
  } catch (err) {
    next(err);
  }
}

// ── GET /catalogs/giros ───────────────────────────────────────────────────────
export async function getGiros(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { q } = req.query as { q?: string };
    const result = await externalCore.getGiros(q);
    res.status(200).json({
      data: result.data.map((g) => ({
        id: g.id,
        descripcion: g.nombre,
        claveIncendio: g.claveIncendio,
      })),
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
}