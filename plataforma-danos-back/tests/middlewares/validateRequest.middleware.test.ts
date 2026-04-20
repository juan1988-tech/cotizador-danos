import { Request, Response, NextFunction } from 'express';
import {
  requireFields,
  validateGeneralData,
  validateLayout,
  validateGarantias,
} from '../../src/middlewares/validateRequest';
import { MissingRequiredFieldError, ValidationError } from '../../src/utils/errors';

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildReq(body: Record<string, unknown> = {}): Request {
  return { body } as unknown as Request;
}

const res: Response = {} as unknown as Response;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('validateRequest middlewares', () => {

  // ── requireFields ──────────────────────────────────────────────────────────
  describe('requireFields', () => {
    it('calls next() without error when all required fields are present', () => {
      const next = jest.fn() as NextFunction;
      const middleware = requireFields('version', 'numeroUbicaciones');

      middleware(buildReq({ version: 1, numeroUbicaciones: 3 }), res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('calls next with MissingRequiredFieldError when a field is undefined', () => {
      const next = jest.fn() as NextFunction;
      const middleware = requireFields('version');

      middleware(buildReq({}), res, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(MissingRequiredFieldError);
      expect(err.statusCode).toBe(400);
    });

    it('calls next with MissingRequiredFieldError when a field is null', () => {
      const next = jest.fn() as NextFunction;
      const middleware = requireFields('version');

      middleware(buildReq({ version: null }), res, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(MissingRequiredFieldError);
      expect(err.details).toEqual({ field: 'version' });
      expect(err.message).toContain('version');
    });

    it('reports the first missing field when multiple are required', () => {
      const next = jest.fn() as NextFunction;
      const middleware = requireFields('a', 'b');

      middleware(buildReq({ b: 1 }), res, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(MissingRequiredFieldError);
      expect(err.message).toContain('a');
    });

    it('calls next() when required fields have falsy-but-valid values (0, false)', () => {
      const next = jest.fn() as NextFunction;
      const middleware = requireFields('active', 'count');

      middleware(buildReq({ active: false, count: 0 }), res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  // ── validateGeneralData ────────────────────────────────────────────────────
  describe('validateGeneralData', () => {
    const FUTURE_DATE = '2027-06-01';
    const PAST_DATE = '2020-01-01';
    const LATER_DATE = '2027-07-01';

    it('calls next() without error when body is empty (all validations are optional)', () => {
      const next = jest.fn() as NextFunction;

      validateGeneralData(buildReq({}), res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('calls next with ValidationError for invalid RFC format', () => {
      const next = jest.fn() as NextFunction;

      validateGeneralData(buildReq({ rfcAsegurado: 'INVALID-RFC' }), res, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.details).toHaveProperty('field', 'rfcAsegurado');
    });

    it('calls next() when RFC has a valid format', () => {
      const next = jest.fn() as NextFunction;

      validateGeneralData(buildReq({ rfcAsegurado: 'EEJ900101AAA' }), res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('calls next() when rfcAsegurado is not a string (skips validation)', () => {
      const next = jest.fn() as NextFunction;

      validateGeneralData(buildReq({ rfcAsegurado: 12345 }), res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('calls next with ValidationError for non-ISO vigenciaInicio', () => {
      const next = jest.fn() as NextFunction;

      validateGeneralData(buildReq({ vigenciaInicio: 'not-a-date' }), res, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.details).toHaveProperty('field', 'vigenciaInicio');
    });

    it('calls next with ValidationError when vigenciaInicio is a past date', () => {
      const next = jest.fn() as NextFunction;

      validateGeneralData(buildReq({ vigenciaInicio: PAST_DATE }), res, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.message).toContain('pasada');
    });

    it('calls next() when vigenciaInicio is a valid future date', () => {
      const next = jest.fn() as NextFunction;

      validateGeneralData(buildReq({ vigenciaInicio: FUTURE_DATE }), res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('calls next() when vigenciaInicio is not a string (skips validation)', () => {
      const next = jest.fn() as NextFunction;

      validateGeneralData(buildReq({ vigenciaInicio: 20270601 }), res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('calls next with ValidationError for non-ISO vigenciaFin', () => {
      const next = jest.fn() as NextFunction;

      validateGeneralData(buildReq({ vigenciaFin: 'not-a-date' }), res, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.details).toHaveProperty('field', 'vigenciaFin');
    });

    it('calls next with ValidationError when vigenciaFin equals vigenciaInicio', () => {
      const next = jest.fn() as NextFunction;

      validateGeneralData(
        buildReq({ vigenciaInicio: FUTURE_DATE, vigenciaFin: FUTURE_DATE }),
        res,
        next,
      );

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.message).toContain('posterior');
    });

    it('calls next with ValidationError when vigenciaFin is before vigenciaInicio', () => {
      const next = jest.fn() as NextFunction;

      validateGeneralData(
        buildReq({ vigenciaInicio: LATER_DATE, vigenciaFin: FUTURE_DATE }),
        res,
        next,
      );

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.message).toContain('posterior');
    });

    it('calls next() when both dates are valid and vigenciaFin > vigenciaInicio', () => {
      const next = jest.fn() as NextFunction;

      validateGeneralData(
        buildReq({ vigenciaInicio: FUTURE_DATE, vigenciaFin: LATER_DATE }),
        res,
        next,
      );

      expect(next).toHaveBeenCalledWith();
    });

    it('calls next() when vigenciaFin is valid but vigenciaInicio is absent', () => {
      const next = jest.fn() as NextFunction;

      validateGeneralData(buildReq({ vigenciaFin: FUTURE_DATE }), res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  // ── validateLayout ─────────────────────────────────────────────────────────
  describe('validateLayout', () => {
    it('calls next() when payload is valid (UNIFORME, 5)', () => {
      const next = jest.fn() as NextFunction;

      validateLayout(buildReq({ numeroUbicaciones: 5, tipoLayout: 'UNIFORME' }), res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('calls next() when payload is valid (PERSONALIZADO, 1)', () => {
      const next = jest.fn() as NextFunction;

      validateLayout(buildReq({ numeroUbicaciones: 1, tipoLayout: 'PERSONALIZADO' }), res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('accepts boundary value 1', () => {
      const next = jest.fn() as NextFunction;

      validateLayout(buildReq({ numeroUbicaciones: 1, tipoLayout: 'UNIFORME' }), res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('accepts boundary value 50', () => {
      const next = jest.fn() as NextFunction;

      validateLayout(buildReq({ numeroUbicaciones: 50, tipoLayout: 'PERSONALIZADO' }), res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('calls next with ValidationError when numeroUbicaciones is a float', () => {
      const next = jest.fn() as NextFunction;

      validateLayout(buildReq({ numeroUbicaciones: 1.5, tipoLayout: 'UNIFORME' }), res, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.details).toHaveProperty('field', 'numeroUbicaciones');
    });

    it('calls next with ValidationError when numeroUbicaciones is a string', () => {
      const next = jest.fn() as NextFunction;

      validateLayout(buildReq({ numeroUbicaciones: '3', tipoLayout: 'UNIFORME' }), res, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.details).toHaveProperty('field', 'numeroUbicaciones');
    });

    it('calls next with ValidationError when numeroUbicaciones is 0 (below minimum)', () => {
      const next = jest.fn() as NextFunction;

      validateLayout(buildReq({ numeroUbicaciones: 0, tipoLayout: 'UNIFORME' }), res, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.message).toContain('50');
    });

    it('calls next with ValidationError when numeroUbicaciones exceeds 50', () => {
      const next = jest.fn() as NextFunction;

      validateLayout(buildReq({ numeroUbicaciones: 51, tipoLayout: 'UNIFORME' }), res, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
    });

    it('calls next with ValidationError when tipoLayout is invalid', () => {
      const next = jest.fn() as NextFunction;

      validateLayout(buildReq({ numeroUbicaciones: 5, tipoLayout: 'INVALIDO' }), res, next);

      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.details).toHaveProperty('field', 'tipoLayout');
    });
  });

  // ── validateGarantias ──────────────────────────────────────────────────────
  describe('validateGarantias', () => {
    it('returns null for a valid array of garantias with positive sumaAsegurada', () => {
      expect(
        validateGarantias([{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 }]),
      ).toBeNull();
    });

    it('returns null for an empty array', () => {
      expect(validateGarantias([])).toBeNull();
    });

    it('returns null when value is null (non-array)', () => {
      expect(validateGarantias(null)).toBeNull();
    });

    it('returns null when value is undefined (non-array)', () => {
      expect(validateGarantias(undefined)).toBeNull();
    });

    it('returns null when value is a non-array string', () => {
      expect(validateGarantias('not-an-array')).toBeNull();
    });

    it('returns an error message when sumaAsegurada is 0', () => {
      const result = validateGarantias([{ tipoGarantia: 'INCENDIO', sumaAsegurada: 0 }]);

      expect(result).not.toBeNull();
      expect(result).toContain('sumaAsegurada');
    });

    it('returns an error message when sumaAsegurada is negative', () => {
      const result = validateGarantias([{ tipoGarantia: 'INCENDIO', sumaAsegurada: -100 }]);

      expect(result).not.toBeNull();
    });

    it('returns null for multiple valid garantias', () => {
      const result = validateGarantias([
        { tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 },
        { tipoGarantia: 'CAT_NATURAL', sumaAsegurada: 300000 },
      ]);

      expect(result).toBeNull();
    });
  });
});
