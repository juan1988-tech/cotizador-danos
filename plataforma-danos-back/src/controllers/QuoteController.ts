import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { QuoteRepository } from '../repositories/QuoteRepository';
import { DatosAsegurado, OpcionCobertura, UpdateGeneralInfoRequest } from '../models/Quote';
import {
  InvalidQuoteStateTransitionError,
  NoCoverageSelectedError,
  NoValidLocationsError,
  ObligatoryCoberturaCantBeDeselectedError,
  QuoteNotFoundError,
  VersionConflictError,
} from '../utils/errors';
import { isGeneralDataComplete, advanceEstado } from '../utils/helpers';
import { PremiumService } from '../services/PremiumService';

// ── POST /quotes ──────────────────────────────────────────────────────────────
export async function postQuote(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const year = new Date().getFullYear();
    const seqResult = await pool.query(`SELECT nextval('seq_folios') AS seq`);
    const seq = (seqResult.rows[0] as { seq: string | number }).seq;
    const numeroFolio = `COT-${year}-${String(seq).padStart(6, '0')}`;

    const repo = new QuoteRepository(pool);
    const quote = await repo.save({ numeroFolio });

    res.status(201).json({
      data: {
        numeroFolio: quote.numeroFolio,
        estadoCotizacion: quote.estadoCotizacion,
        version: quote.version,
        fechaCreacion: quote.fechaCreacion.toISOString(),
        fechaUltimaActualizacion: quote.fechaUltimaActualizacion.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /quotes/:folio ────────────────────────────────────────────────────────
export async function getQuote(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const repo = new QuoteRepository(pool);
    const quote = await repo.findByFolio(req.params.folio);
    if (quote === null) {
      next(new QuoteNotFoundError(req.params.folio));
      return;
    }
    res.status(200).json({ data: quote });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /quotes/:folio/general-data ────────────────────────────────────────
export async function patchGeneralData(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { version, ...fields } = req.body as UpdateGeneralInfoRequest;
    const repo = new QuoteRepository(pool);

    const current = await repo.findByFolio(req.params.folio);
    if (current === null) {
      next(new QuoteNotFoundError(req.params.folio));
      return;
    }

    const merged: DatosAsegurado = { ...(current.datosAsegurado ?? {}), ...fields };
    const newEstado = isGeneralDataComplete(merged as Record<string, unknown>)
      ? advanceEstado(current.estadoCotizacion, 'DATOS_GENERALES_COMPLETOS')
      : current.estadoCotizacion;

    const updated = await repo.update(
      req.params.folio,
      { datosAsegurado: merged, estadoCotizacion: newEstado },
      version,
    );

    res.status(200).json({
      data: {
        numeroFolio: updated.numeroFolio,
        estadoCotizacion: updated.estadoCotizacion,
        datosAsegurado: updated.datosAsegurado,
        version: updated.version,
        fechaUltimaActualizacion: updated.fechaUltimaActualizacion.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── Default coverage catalog ──────────────────────────────────────────────────
const DEFAULT_COVERAGE_OPTIONS: {
  codigoCobertura: string;
  descripcion: string;
  obligatoria: boolean;
  seleccionada: boolean;
}[] = [
  { codigoCobertura: 'COB-001', descripcion: 'Incendio y/o Rayo',       obligatoria: true,  seleccionada: true  },
  { codigoCobertura: 'COB-002', descripcion: 'Catástrofe Natural',        obligatoria: false, seleccionada: false },
  { codigoCobertura: 'COB-003', descripcion: 'Interrupción de Negocio',   obligatoria: false, seleccionada: false },
];

// ── GET /quotes/:folio/coverage-options ──────────────────────────────────────
export async function getCoverageOptions(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { folio } = req.params;
    const { rows } = await pool.query(
      `SELECT numero_folio, opciones_cobertura FROM quotes WHERE numero_folio = $1`,
      [folio],
    );

    if (rows.length === 0) {
      next(new QuoteNotFoundError(folio));
      return;
    }

    type StoredOption = { codigoCobertura: string; seleccionada: boolean };
    const stored = (rows[0] as { opciones_cobertura: StoredOption[] | null }).opciones_cobertura;

    const opcionesCobertura = DEFAULT_COVERAGE_OPTIONS.map((def) => {
      const saved = stored?.find((s) => s.codigoCobertura === def.codigoCobertura);
      return { ...def, seleccionada: saved !== undefined ? saved.seleccionada : def.seleccionada };
    });

    res.status(200).json({ data: opcionesCobertura });
  } catch (err) {
    next(err);
  }
}

// ── PUT /quotes/:folio/coverage-options ──────────────────────────────────────
export async function putCoverageOptions(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { folio } = req.params;
    const { opcionesCobertura: input, version } = req.body as {
      opcionesCobertura: { codigoCobertura: string; seleccionada: boolean }[];
      version: number;
    };

    // 1. Existence + optimistic lock pre-check
    const { rows } = await pool.query(
      `SELECT version, estado_cotizacion, opciones_cobertura, primas_por_ubicacion
         FROM quotes WHERE numero_folio = $1`,
      [folio],
    );
    if (rows.length === 0) { next(new QuoteNotFoundError(folio)); return; }

    const row = rows[0] as {
      version: number;
      estado_cotizacion: import('../models/Quote').QuoteState;
      opciones_cobertura: unknown;
      primas_por_ubicacion: unknown;
    };

    if (row.version !== version) {
      next(new VersionConflictError(version, row.version));
      return;
    }

    // 2. Guard: obligatory coverages cannot be deselected
    for (const item of input) {
      const def = DEFAULT_COVERAGE_OPTIONS.find((d) => d.codigoCobertura === item.codigoCobertura);
      if (def?.obligatoria && !item.seleccionada) {
        next(new ObligatoryCoberturaCantBeDeselectedError(item.codigoCobertura));
        return;
      }
    }

    // 3. Build persisted options (merge with catalog for descripcion + obligatoria)
    const merged = DEFAULT_COVERAGE_OPTIONS.map((def) => {
      const incoming = input.find((i) => i.codigoCobertura === def.codigoCobertura);
      return {
        codigoCobertura: def.codigoCobertura,
        descripcion:     def.descripcion,
        obligatoria:     def.obligatoria,
        seleccionada:    incoming !== undefined ? incoming.seleccionada : def.seleccionada,
      };
    });

    // 4. Determine if a previous calculation should be invalidated
    const calculoInvalidado = row.primas_por_ubicacion != null;
    const primasUpdate = calculoInvalidado ? 'NULL' : 'primas_por_ubicacion';

    // 4b. Advance (or roll back) the state
    const newEstado = calculoInvalidado
      ? 'COBERTURAS_SELECCIONADAS'
      : advanceEstado(row.estado_cotizacion, 'COBERTURAS_SELECCIONADAS');

    // 5. Persist with optimistic locking
    const updateResult = await pool.query(
      `UPDATE quotes
          SET opciones_cobertura      = $3,
              estado_cotizacion       = $4,
              primas_por_ubicacion    = ${primasUpdate},
              version                 = version + 1
        WHERE numero_folio = $1 AND version = $2
        RETURNING version, fecha_ultima_actualizacion`,
      [folio, version, JSON.stringify(merged), newEstado],
    );

    if (updateResult.rows.length === 0) {
      next(new VersionConflictError(version, row.version));
      return;
    }

    const updated = updateResult.rows[0] as {
      version: number;
      fecha_ultima_actualizacion: Date;
    };

    res.status(200).json({
      data: {
        numeroFolio:              folio,
        estadoCotizacion:         newEstado,
        opcionesCobertura:        merged,
        calculoInvalidado,
        version:                  updated.version,
        fechaUltimaActualizacion: updated.fecha_ultima_actualizacion,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /quotes/:folio/calculate ────────────────────────────────────────────
export async function postCalculate(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { folio } = req.params;
    const { version } = req.body as { version: number };

    // 1. Retrieve quote
    const repo = new QuoteRepository(pool);
    const quote = await repo.findByFolio(folio);
    if (quote === null) {
      next(new QuoteNotFoundError(folio));
      return;
    }

    // 2. Validate state: must be COBERTURAS_SELECCIONADAS or CALCULADA
    const VALID_CALC_STATES = ['COBERTURAS_SELECCIONADAS', 'CALCULADA'] as const;
    if (!(VALID_CALC_STATES as readonly string[]).includes(quote.estadoCotizacion)) {
      next(new InvalidQuoteStateTransitionError(quote.estadoCotizacion, 'calculate'));
      return;
    }

    // 3. Optimistic lock pre-check
    if (quote.version !== version) {
      next(new VersionConflictError(version, quote.version));
      return;
    }

    // 4. Run premium calculation
    const svc = new PremiumService();
    const result = await svc.calculate(folio, (quote.opcionesCobertura ?? []) as OpcionCobertura[]);

    // 5. Persist result atomically with optimistic lock
    const updated = await repo.update(
      folio,
      {
        estadoCotizacion: 'CALCULADA',
        primasPorUbicacion: result.primasPorUbicacion,
      },
      version,
    );

    res.status(200).json({
      data: {
        numeroFolio: updated.numeroFolio,
        estadoCotizacion: updated.estadoCotizacion,
        primaNetaTotal: result.primaNetaTotal,
        primaComercialTotal: result.primaComercialTotal,
        primasPorUbicacion: result.primasPorUbicacion,
        ubicacionesExcluidas: result.ubicacionesExcluidas,
        version: updated.version,
        fechaUltimaActualizacion: updated.fechaUltimaActualizacion.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}