import { Request, Response, NextFunction } from 'express';

// ── POST /quotes ──────────────────────────────────────────────────────────────
export async function postQuote(
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: reserve folio in Plataforma-core-ohs and persist the quote
    next(new Error('postQuote not yet implemented'));
  } catch (err) {
    next(err);
  }
}

// ── GET /quotes/:folio ────────────────────────────────────────────────────────
export async function getQuote(
  _req: Request<{ folio: string }>,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: load full quote state from DB
    next(new Error('getQuote not yet implemented'));
  } catch (err) {
    next(err);
  }
}

// ── PATCH /quotes/:folio/general-data ────────────────────────────────────────
export async function patchGeneralData(
  _req: Request<{ folio: string }>,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: partial update of datos_asegurado with optimistic locking
    next(new Error('patchGeneralData not yet implemented'));
  } catch (err) {
    next(err);
  }
}

// ── GET /quotes/:folio/coverage-options ──────────────────────────────────────
export async function getCoverageOptions(
  _req: Request<{ folio: string }>,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: return persisted or default coverage options
    next(new Error('getCoverageOptions not yet implemented'));
  } catch (err) {
    next(err);
  }
}

// ── PUT /quotes/:folio/coverage-options ──────────────────────────────────────
export async function putCoverageOptions(
  _req: Request<{ folio: string }>,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: persist coverage options and invalidate prior calculation
    next(new Error('putCoverageOptions not yet implemented'));
  } catch (err) {
    next(err);
  }
}

// ── POST /quotes/:folio/calculate ────────────────────────────────────────────
export async function postCalculate(
  _req: Request<{ folio: string }>,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: invoke PremiumService for all COMPLETA locations
    next(new Error('postCalculate not yet implemented'));
  } catch (err) {
    next(err);
  }
}