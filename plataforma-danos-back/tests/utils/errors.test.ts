import {
  AppError,
  QuoteNotFoundError,
  LocationNotFoundError,
  VersionConflictError,
  ValidationError,
  MissingRequiredFieldError,
  ExternalValidationError,
  NoValidLocationsError,
  NoCoverageSelectedError,
  ObligatoryCoberturaCantBeDeselectedError,
  CatalogServiceUnavailableError,
} from '../../src/utils/errors';

describe('AppError hierarchy', () => {
  describe('QuoteNotFoundError', () => {
    it('has 404 status and QuoteNotFound error code', () => {
      const err = new QuoteNotFoundError('COT-2026-001');

      expect(err.statusCode).toBe(404);
      expect(err.errorCode).toBe('QuoteNotFound');
      expect(err.message).toContain('COT-2026-001');
    });

    it('is an instance of AppError and Error', () => {
      const err = new QuoteNotFoundError('x');

      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(Error);
    });

    it('has no details property', () => {
      expect(new QuoteNotFoundError('x').details).toBeUndefined();
    });
  });

  describe('LocationNotFoundError', () => {
    it('has 404 status and LocationNotFound error code', () => {
      const err = new LocationNotFoundError(3);

      expect(err.statusCode).toBe(404);
      expect(err.errorCode).toBe('LocationNotFound');
      expect(err.message).toContain('3');
    });
  });

  describe('VersionConflictError', () => {
    it('has 409 status with expected and current version in details', () => {
      const err = new VersionConflictError(2, 5);

      expect(err.statusCode).toBe(409);
      expect(err.errorCode).toBe('VersionConflict');
      expect(err.details).toEqual({ expectedVersion: 2, currentVersion: 5 });
    });
  });

  describe('ValidationError', () => {
    it('has 400 status and ValidationError error code', () => {
      const err = new ValidationError('RFC inválido', { field: 'rfcAsegurado' });

      expect(err.statusCode).toBe(400);
      expect(err.errorCode).toBe('ValidationError');
      expect(err.details).toEqual({ field: 'rfcAsegurado' });
    });

    it('works without details', () => {
      const err = new ValidationError('Campo inválido');

      expect(err.statusCode).toBe(400);
      expect(err.details).toBeUndefined();
    });
  });

  describe('MissingRequiredFieldError', () => {
    it('has 400 status and includes field name in details', () => {
      const err = new MissingRequiredFieldError('version');

      expect(err.statusCode).toBe(400);
      expect(err.errorCode).toBe('MissingRequiredField');
      expect(err.details).toEqual({ field: 'version' });
      expect(err.message).toContain('version');
    });
  });

  describe('ExternalValidationError', () => {
    it('has 422 status and ExternalValidationError code', () => {
      const err = new ExternalValidationError('Agente no existe', { field: 'agenteId' });

      expect(err.statusCode).toBe(422);
      expect(err.errorCode).toBe('ExternalValidationError');
      expect(err.details).toEqual({ field: 'agenteId' });
    });
  });

  describe('NoValidLocationsError', () => {
    it('has 422 status and lists incomplete indices in details', () => {
      const err = new NoValidLocationsError([1, 2, 3]);

      expect(err.statusCode).toBe(422);
      expect(err.errorCode).toBe('NoValidLocationsForCalculation');
      expect(err.details).toEqual({ ubicacionesIncompletas: [1, 2, 3] });
    });

    it('works with an empty indices array', () => {
      const err = new NoValidLocationsError([]);

      expect(err.details).toEqual({ ubicacionesIncompletas: [] });
    });
  });

  describe('NoCoverageSelectedError', () => {
    it('has 422 status and NoCoverageSelected code', () => {
      const err = new NoCoverageSelectedError();

      expect(err.statusCode).toBe(422);
      expect(err.errorCode).toBe('NoCoverageSelected');
    });
  });

  describe('ObligatoryCoberturaCantBeDeselectedError', () => {
    it('has 422 status and includes codigoCobertura in details', () => {
      const err = new ObligatoryCoberturaCantBeDeselectedError('COB-001');

      expect(err.statusCode).toBe(422);
      expect(err.errorCode).toBe('ObligatoryCoberturaCantBeDeselected');
      expect(err.details).toEqual({ codigoCobertura: 'COB-001' });
      expect(err.message).toContain('COB-001');
    });
  });

  describe('CatalogServiceUnavailableError', () => {
    it('has 503 status and CatalogServiceUnavailable code', () => {
      const err = new CatalogServiceUnavailableError();

      expect(err.statusCode).toBe(503);
      expect(err.errorCode).toBe('CatalogServiceUnavailable');
    });
  });

  describe('InvalidQuoteStateTransitionError', () => {
    it('has 422 status and includes state and operation in details', () => {
      const err = new (require('../../src/utils/errors').InvalidQuoteStateTransitionError)(
        'EN_EDICION',
        'calculate',
      );

      expect(err.statusCode).toBe(422);
      expect(err.errorCode).toBe('InvalidQuoteStateTransition');
      expect(err.details).toEqual({ currentState: 'EN_EDICION', attemptedOperation: 'calculate' });
      expect(err.message).toContain('EN_EDICION');
      expect(err.message).toContain('calculate');
    });
  });
});
