import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import {
  DatosAsegurado,
  EstadoCotizacion,
  OpcionCobertura,
  Quote,
  ResultadoCalculo,
  ConfiguracionLayout,
} from '../models/Quote';
import { DEFAULT_COVERAGE_OPTIONS, OpcionCoberturaInput } from '../models/Coverage';
import { UbicacionResumen, Garantia } from '../models/Location';
import { ExternalCoreService } from '../services/ExternalCoreService';
import { PremiumService } from '../services/PremiumService';
import {
  QuoteNotFoundError,
  VersionConflictError,
  ExternalValidationError,
  NoValidLocationsError,
  NoCoverageSelectedError,
  ObligatoryCoberturaCantBeDeselectedError,
} from '../utils/errors';
import { isGeneralDataComplete, advanceEstado } from '../utils/helpers';

const coreService = new ExternalCoreService();
const premiumService = new PremiumService();

// ── Row mapper ────────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): Quote {
  return {
    numeroFolio: row.numero_folio as string,
    estadoCotizacion: row.estado_cotizacion as EstadoCotizacion,
    datosAsegurado: isPopulatedObject(row.datos_asegurado)
      ? (row.datos_asegurado as DatosAsegurado)
      : null,
    configuracionLayout: isPopulatedObject(row.configuracion_layout)
      ? (row.configuracion_layout as ConfiguracionLayout)
      : null,
    opcionesCobertura: Array.isArray(row.opciones_cobertura)
      ? (row.opciones_cobertura as OpcionCobertura[])
      : null,
    primasPorUbicacion: isPopulatedObject(row.primas_por_ubicacion)
      ? (row.primas_por_ubicacion as ResultadoCalculo)
      : null,
    version: row.version as number,
    fechaCreacion: (row.fecha_creacion as Date).toISOString(),
    fechaUltimaActualizacion: (row.fecha_ultima_actualizacion as Date).toISOString(),
  };
}

function isPopulatedObject(value: unknown): boolean {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value as object).length > 0
  );
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function findQuote(folio: string): Promise<Quote> {
  const result = await pool.query(
    `SELECT numero_folio, estado_cotizacion, datos_asegurado, configuracion_layout,
            opciones_cobertura, primas_por_ubicacion, version,
            fecha_creacion, fecha_ultima_actualizacion
     FROM quotes WHERE numero_folio = $1`,
    [folio]
  );
  if (result.rows.length === 0) throw new QuoteNotFoundError(folio);
  return mapRow(result.rows[0] as Record<string, unknown>);
}

async function getLocationsSummary(
  folio: string
): Promise<{ rows: UbicacionResumen[]; completas: number }> {
  const result = await pool.query(
    `SELECT indice_ubicacion, descripcion, codigo_postal, giro_id,
            estado_validacion, alertas_bloqueantes, garantias, version
     FROM locations WHERE numero_folio = $1 ORDER BY indice_ubicacion`,
    [folio]
  );
  const rows = result.rows.map((r: Record<string, unknown>) => ({
    indiceUbicacion: r.indice_ubicacion as number,
    descripcion: r.descripcion as string | null,
    codigoPostal: r.codigo_postal as string | null,
    giroId: r.giro_id as string | null,
    estadoValidacion: r.estado_validacion as 'COMPLETA' | 'INCOMPLETA',
    alertasBloqueantes: (r.alertas_bloqueantes as string[]) ?? [],
    garantias: (r.garantias as Garantia[]) ?? [],
    version: r.version as number,
  }));
  const completas = rows.filter(r => r.estadoValidacion === 'COMPLETA').length;
  return { rows, completas };
}

// ── POST /api/v1/quotes ───────────────────────────────────────────────────────

export async function createQuote(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const folio = await coreService.generateFolio();

    // Idempotency: return existing quote if folio already exists
    const existing = await pool.query(
      `SELECT numero_folio, estado_cotizacion, version, fecha_creacion, fecha_ultima_actualizacion
       FROM quotes WHERE numero_folio = $1`,
      [folio]
    );
    if (existing.rows.length > 0) {
      const row = existing.rows[0] as Record<string, unknown>;
      res.status(200).json({
        data: {
          numeroFolio: row.numero_folio,
          estadoCotizacion: row.estado_cotizacion,
          version: row.version,
          fechaCreacion: (row.fecha_creacion as Date).toISOString(),
          fechaUltimaActualizacion: (row.fecha_ultima_actualizacion as Date).toISOString(),
        },
      });
      return;
    }

    const insert = await pool.query(
      `INSERT INTO quotes (numero_folio, estado_cotizacion, datos_asegurado,
              configuracion_layout, opciones_cobertura, primas_por_ubicacion, version)
       VALUES ($1, 'EN_EDICION', NULL, NULL, NULL, NULL, 1)
       RETURNING numero_folio, estado_cotizacion, version, fecha_creacion, fecha_ultima_actualizacion`,
      [folio]
    );
    const row = insert.rows[0] as Record<string, unknown>;

    res.status(201).json({
      data: {
        numeroFolio: row.numero_folio,
        estadoCotizacion: row.estado_cotizacion,
        version: row.version,
        fechaCreacion: (row.fecha_creacion as Date).toISOString(),
        fechaUltimaActualizacion: (row.fecha_ultima_actualizacion as Date).toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/v1/quotes/:folio ─────────────────────────────────────────────────

export async function getQuote(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const quote = await findQuote(req.params.folio);
    res.status(200).json({ data: quote });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/v1/quotes/:folio/general-data ──────────────────────────────────

export async function patchGeneralData(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const folio = req.params.folio;
    const body = req.body as Partial<DatosAsegurado> & { version: number };

    const quote = await findQuote(folio);

    if (quote.version !== body.version) {
      throw new VersionConflictError(body.version, quote.version);
    }

    // Validate external catalog references when provided
    if (body.agenteId) {
      const exists = await coreService.agentExists(body.agenteId);
      if (!exists) {
        throw new ExternalValidationError(
          `El agente '${body.agenteId}' no existe en el catálogo.`,
          { field: 'agenteId', value: body.agenteId }
        );
      }
    }
    if (body.suscriptorId) {
      const exists = await coreService.subscriberExists(body.suscriptorId);
      if (!exists) {
        throw new ExternalValidationError(
          `El suscriptor '${body.suscriptorId}' no existe en el catálogo.`,
          { field: 'suscriptorId', value: body.suscriptorId }
        );
      }
    }
    if (body.giroId) {
      const exists = await coreService.giroExists(body.giroId);
      if (!exists) {
        throw new ExternalValidationError(`El giro '${body.giroId}' no existe en el catálogo.`, {
          field: 'giroId',
          value: body.giroId,
        });
      }
    }

    // Merge with existing data
    const current = quote.datosAsegurado ?? {};
    const { version: _v, ...fields } = body;
    const updated: DatosAsegurado = { ...current, ...fields } as DatosAsegurado;

    const newEstado: EstadoCotizacion = isGeneralDataComplete(updated)
      ? advanceEstado(quote.estadoCotizacion, 'DATOS_GENERALES_COMPLETOS')
      : 'EN_EDICION';

    const result = await pool.query(
      `UPDATE quotes
       SET datos_asegurado = $1,
           estado_cotizacion = $2,
           version = version + 1,
           fecha_ultima_actualizacion = NOW()
       WHERE numero_folio = $3 AND version = $4
       RETURNING numero_folio, estado_cotizacion, datos_asegurado, version, fecha_ultima_actualizacion`,
      [JSON.stringify(updated), newEstado, folio, quote.version]
    );

    if (result.rows.length === 0) {
      throw new VersionConflictError(body.version, quote.version + 1);
    }

    const row = result.rows[0] as Record<string, unknown>;
    res.status(200).json({
      data: {
        numeroFolio: row.numero_folio,
        estadoCotizacion: row.estado_cotizacion,
        datosAsegurado: row.datos_asegurado,
        version: row.version,
        fechaUltimaActualizacion: (row.fecha_ultima_actualizacion as Date).toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/v1/quotes/:folio/coverage-options ────────────────────────────────

export async function getCoverageOptions(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const quote = await findQuote(req.params.folio);
    const opcionesCobertura = quote.opcionesCobertura ?? DEFAULT_COVERAGE_OPTIONS;
    res.status(200).json({ data: { opcionesCobertura } });
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/v1/quotes/:folio/coverage-options ────────────────────────────────

export async function putCoverageOptions(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const folio = req.params.folio;
    const { opcionesCobertura, version } = req.body as {
      opcionesCobertura: OpcionCoberturaInput[];
      version: number;
    };

    const quote = await findQuote(folio);
    if (quote.version !== version) {
      throw new VersionConflictError(version, quote.version);
    }

    // Build full options merging defaults for descriptions and obligatoria flags
    const defaults = new Map(DEFAULT_COVERAGE_OPTIONS.map(d => [d.codigoCobertura, d]));
    const existing = new Map(
      (quote.opcionesCobertura ?? DEFAULT_COVERAGE_OPTIONS).map(c => [c.codigoCobertura, c])
    );

    const merged: OpcionCobertura[] = opcionesCobertura.map(input => {
      const def = defaults.get(input.codigoCobertura) ?? existing.get(input.codigoCobertura);
      if (def?.obligatoria && !input.seleccionada) {
        throw new ObligatoryCoberturaCantBeDeselectedError(input.codigoCobertura);
      }
      return {
        codigoCobertura: input.codigoCobertura,
        descripcion: def?.descripcion ?? input.codigoCobertura,
        seleccionada: input.seleccionada,
        obligatoria: def?.obligatoria ?? false,
      };
    });

    const calculoInvalidado = quote.primasPorUbicacion !== null;
    const newEstado = advanceEstado(quote.estadoCotizacion, 'COBERTURAS_SELECCIONADAS');

    const result = await pool.query(
      `UPDATE quotes
       SET opciones_cobertura = $1,
           primas_por_ubicacion = NULL,
           estado_cotizacion = $2,
           version = version + 1,
           fecha_ultima_actualizacion = NOW()
       WHERE numero_folio = $3 AND version = $4
       RETURNING numero_folio, opciones_cobertura, version, fecha_ultima_actualizacion`,
      [JSON.stringify(merged), newEstado, folio, quote.version]
    );

    if (result.rows.length === 0) {
      throw new VersionConflictError(version, quote.version + 1);
    }

    const row = result.rows[0] as Record<string, unknown>;
    res.status(200).json({
      data: {
        numeroFolio: row.numero_folio,
        opcionesCobertura: row.opciones_cobertura,
        calculoInvalidado,
        version: row.version,
        fechaUltimaActualizacion: (row.fecha_ultima_actualizacion as Date).toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/v1/quotes/:folio/calculate ─────────────────────────────────────

export async function calculatePremium(
  req: Request<{ folio: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const folio = req.params.folio;
    const { version } = req.body as { version: number };

    const quote = await findQuote(folio);
    if (quote.version !== version) {
      throw new VersionConflictError(version, quote.version);
    }

    const { rows: locations } = await getLocationsSummary(folio);

    const completeLocations = locations.filter(l => l.estadoValidacion === 'COMPLETA');
    if (completeLocations.length === 0) {
      throw new NoValidLocationsError(locations.map(l => l.indiceUbicacion));
    }

    const coverageOptions = quote.opcionesCobertura ?? DEFAULT_COVERAGE_OPTIONS;
    const hasSelectedCoverage = coverageOptions.some(c => c.seleccionada);
    if (!hasSelectedCoverage) throw new NoCoverageSelectedError();

    const resultado = await premiumService.calculate(locations, coverageOptions);

    const result = await pool.query(
      `UPDATE quotes
       SET primas_por_ubicacion = $1,
           estado_cotizacion = 'CALCULADA',
           version = version + 1,
           fecha_ultima_actualizacion = NOW()
       WHERE numero_folio = $2 AND version = $3
       RETURNING version, fecha_ultima_actualizacion`,
      [JSON.stringify(resultado), folio, quote.version]
    );

    if (result.rows.length === 0) {
      throw new VersionConflictError(version, quote.version + 1);
    }

    const row = result.rows[0] as Record<string, unknown>;
    res.status(200).json({
      data: {
        numeroFolio: folio,
        estadoCotizacion: 'CALCULADA',
        primaNetaTotal: resultado.primaNetaTotal,
        primaComercialTotal: resultado.primaComercialTotal,
        primasPorUbicacion: resultado.primasPorUbicacion,
        ubicacionesExcluidas: resultado.ubicacionesExcluidas,
        version: row.version,
        fechaUltimaActualizacion: (row.fecha_ultima_actualizacion as Date).toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}
