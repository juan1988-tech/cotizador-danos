import { Request, Response, NextFunction } from 'express';

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
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: proxy to Plataforma-core-ohs /giros, support ?q filter
    next(new Error('getGiros not yet implemented'));
  } catch (err) {
    next(err);
  }
}