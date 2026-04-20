import {
  isValidRFC,
  isValidISODate,
  isPastDate,
  isGeneralDataComplete,
  advanceEstado,
} from '../../src/utils/helpers';

describe('isValidRFC', () => {
  it('returns true for valid 4-letter RFC', () => {
    expect(isValidRFC('XAXX010101000')).toBe(true);
  });

  it('returns true for valid 3-letter RFC', () => {
    expect(isValidRFC('SAT970701NN3')).toBe(true);
  });

  it('returns true for lowercase RFC (case-insensitive)', () => {
    expect(isValidRFC('eej900101aaa')).toBe(true);
  });

  it('returns false for RFC that is too short', () => {
    expect(isValidRFC('ABC12345')).toBe(false);
  });

  it('returns false for RFC with special characters', () => {
    expect(isValidRFC('AB@1234567890')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidRFC('')).toBe(false);
  });
});

describe('isValidISODate', () => {
  it('returns true for valid YYYY-MM-DD format', () => {
    expect(isValidISODate('2026-05-01')).toBe(true);
  });

  it('returns false for an invalid date string', () => {
    expect(isValidISODate('not-a-date')).toBe(false);
  });

  it('returns false for a datetime string with time component', () => {
    expect(isValidISODate('2026-05-01T10:00:00')).toBe(false);
  });

  it('returns false for date in DD/MM/YYYY format', () => {
    expect(isValidISODate('01/05/2026')).toBe(false);
  });
});

describe('isPastDate', () => {
  it('returns true for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isPastDate(yesterday.toISOString().split('T')[0])).toBe(true);
  });

  it('returns false for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isPastDate(tomorrow.toISOString().split('T')[0])).toBe(false);
  });

  it('returns false for a date two days from now', () => {
    const future = new Date();
    future.setDate(future.getDate() + 2);
    expect(isPastDate(future.toISOString().split('T')[0])).toBe(false);
  });
});

describe('isGeneralDataComplete', () => {
  const completeData = {
    nombreAsegurado: 'Empresa Test S.A.',
    rfcAsegurado: 'EEJ900101AAA',
    agenteId: 'AGT-001',
    suscriptorId: 'SUB-042',
    tipoNegocio: 'Comercio al por menor',
    giroId: 'GIR-015',
    vigenciaInicio: '2026-05-01',
    vigenciaFin: '2027-05-01',
  };

  it('returns true when all required fields are present', () => {
    expect(isGeneralDataComplete(completeData)).toBe(true);
  });

  it('returns false when nombreAsegurado is missing', () => {
    const { nombreAsegurado: _n, ...rest } = completeData;
    expect(isGeneralDataComplete(rest)).toBe(false);
  });

  it('returns false when agenteId is missing', () => {
    const { agenteId: _a, ...rest } = completeData;
    expect(isGeneralDataComplete(rest)).toBe(false);
  });

  it('returns false when vigenciaFin is missing', () => {
    const { vigenciaFin: _v, ...rest } = completeData;
    expect(isGeneralDataComplete(rest)).toBe(false);
  });

  it('returns false for an empty object', () => {
    expect(isGeneralDataComplete({})).toBe(false);
  });
});

describe('advanceEstado', () => {
  it('advances from EN_EDICION to DATOS_GENERALES_COMPLETOS', () => {
    expect(advanceEstado('EN_EDICION', 'DATOS_GENERALES_COMPLETOS')).toBe(
      'DATOS_GENERALES_COMPLETOS',
    );
  });

  it('stays at CALCULADA when candidate is a lower state', () => {
    expect(advanceEstado('CALCULADA', 'EN_EDICION')).toBe('CALCULADA');
  });

  it('returns the same state when current equals candidate', () => {
    expect(advanceEstado('UBICACIONES_CONFIGURADAS', 'UBICACIONES_CONFIGURADAS')).toBe(
      'UBICACIONES_CONFIGURADAS',
    );
  });

  it('advances through the state progression correctly', () => {
    expect(advanceEstado('DATOS_GENERALES_COMPLETOS', 'UBICACIONES_CONFIGURADAS')).toBe(
      'UBICACIONES_CONFIGURADAS',
    );
    expect(advanceEstado('UBICACIONES_CONFIGURADAS', 'COBERTURAS_SELECCIONADAS')).toBe(
      'COBERTURAS_SELECCIONADAS',
    );
  });
});
