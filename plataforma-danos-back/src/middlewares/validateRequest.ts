import { Request, Response, NextFunction } from 'express';
import { MissingRequiredFieldError, ValidationError } from '../utils/errors';
import { isValidRFC, isValidISODate, isPastDate } from '../utils/helpers';

export function requireFields(...fields: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        return next(new MissingRequiredFieldError(field));
      }
    }
    next();
  };
}

export function validateGeneralData(req: Request, _res: Response, next: NextFunction): void {
  const body = req.body as Record<string, unknown>;

  if (body.rfcAsegurado !== undefined && typeof body.rfcAsegurado === 'string') {
    if (!isValidRFC(body.rfcAsegurado)) {
      return next(
        new ValidationError('El RFC no tiene un formato válido.', {
          field: 'rfcAsegurado',
          value: body.rfcAsegurado,
        })
      );
    }
  }

  if (body.vigenciaInicio !== undefined && typeof body.vigenciaInicio === 'string') {
    if (!isValidISODate(body.vigenciaInicio)) {
      return next(
        new ValidationError('vigenciaInicio debe ser una fecha válida en formato YYYY-MM-DD.', {
          field: 'vigenciaInicio',
        })
      );
    }
    if (isPastDate(body.vigenciaInicio)) {
      return next(
        new ValidationError('vigenciaInicio no puede ser una fecha pasada.', {
          field: 'vigenciaInicio',
          value: body.vigenciaInicio,
        })
      );
    }
  }

  if (body.vigenciaFin !== undefined && typeof body.vigenciaFin === 'string') {
    if (!isValidISODate(body.vigenciaFin)) {
      return next(
        new ValidationError('vigenciaFin debe ser una fecha válida en formato YYYY-MM-DD.', {
          field: 'vigenciaFin',
        })
      );
    }
    if (
      body.vigenciaInicio &&
      typeof body.vigenciaInicio === 'string' &&
      body.vigenciaFin <= body.vigenciaInicio
    ) {
      return next(
        new ValidationError('vigenciaFin debe ser posterior a vigenciaInicio.', {
          field: 'vigenciaFin',
          value: body.vigenciaFin,
        })
      );
    }
  }

  next();
}

export function validateLayout(req: Request, _res: Response, next: NextFunction): void {
  const { numeroUbicaciones, tipoLayout } = req.body as Record<string, unknown>;

  if (typeof numeroUbicaciones !== 'number' || !Number.isInteger(numeroUbicaciones)) {
    return next(
      new ValidationError('numeroUbicaciones debe ser un número entero.', {
        field: 'numeroUbicaciones',
      })
    );
  }
  if (numeroUbicaciones < 1 || numeroUbicaciones > 50) {
    return next(
      new ValidationError('numeroUbicaciones debe estar entre 1 y 50.', {
        field: 'numeroUbicaciones',
        value: numeroUbicaciones,
      })
    );
  }
  if (tipoLayout !== 'UNIFORME' && tipoLayout !== 'PERSONALIZADO') {
    return next(
      new ValidationError("tipoLayout debe ser 'UNIFORME' o 'PERSONALIZADO'.", {
        field: 'tipoLayout',
        value: tipoLayout,
      })
    );
  }

  next();
}

export function validateGarantias(garantias: unknown): string | null {
  if (!Array.isArray(garantias)) return null;
  for (const g of garantias as Record<string, unknown>[]) {
    if (typeof g.sumaAsegurada !== 'number' || g.sumaAsegurada <= 0) {
      return 'sumaAsegurada debe ser un número positivo mayor a 0.';
    }
  }
  return null;
}
