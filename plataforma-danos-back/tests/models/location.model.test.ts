import { computeValidation } from '../../src/models/Location';

describe('computeValidation', () => {
  it('returns INCOMPLETA with 3 alerts when all fields are missing', () => {
    const result = computeValidation({ codigoPostal: null, giroId: null, garantias: [] });

    expect(result.estadoValidacion).toBe('INCOMPLETA');
    expect(result.alertasBloqueantes).toHaveLength(3);
  });

  it('returns INCOMPLETA with 1 alert when only codigoPostal is missing', () => {
    const result = computeValidation({
      codigoPostal: null,
      giroId: 'GIR-015',
      garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 }],
    });

    expect(result.estadoValidacion).toBe('INCOMPLETA');
    expect(result.alertasBloqueantes).toContain('Código postal no válido o no encontrado');
    expect(result.alertasBloqueantes).toHaveLength(1);
  });

  it('returns INCOMPLETA with 1 alert when only giroId is missing', () => {
    const result = computeValidation({
      codigoPostal: '06600',
      giroId: null,
      garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 }],
    });

    expect(result.estadoValidacion).toBe('INCOMPLETA');
    expect(result.alertasBloqueantes).toContain('El giro seleccionado no tiene tarifa de incendio asociada');
    expect(result.alertasBloqueantes).toHaveLength(1);
  });

  it('returns INCOMPLETA when garantias array is empty', () => {
    const result = computeValidation({
      codigoPostal: '06600',
      giroId: 'GIR-015',
      garantias: [],
    });

    expect(result.estadoValidacion).toBe('INCOMPLETA');
    expect(result.alertasBloqueantes).toContain(
      'La ubicación no tiene garantías tarifables para calcular',
    );
  });

  it('returns INCOMPLETA when all garantias have sumaAsegurada = 0', () => {
    const result = computeValidation({
      codigoPostal: '06600',
      giroId: 'GIR-015',
      garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 0 }],
    });

    expect(result.estadoValidacion).toBe('INCOMPLETA');
    expect(result.alertasBloqueantes).toContain(
      'La ubicación no tiene garantías tarifables para calcular',
    );
  });

  it('returns COMPLETA with empty alerts when all required fields are valid', () => {
    const result = computeValidation({
      codigoPostal: '06600',
      giroId: 'GIR-015',
      garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 }],
    });

    expect(result.estadoValidacion).toBe('COMPLETA');
    expect(result.alertasBloqueantes).toHaveLength(0);
  });

  it('returns COMPLETA when multiple valid garantias are provided', () => {
    const result = computeValidation({
      codigoPostal: '44100',
      giroId: 'GIR-030',
      garantias: [
        { tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 },
        { tipoGarantia: 'CAT_NATURAL', sumaAsegurada: 300000 },
      ],
    });

    expect(result.estadoValidacion).toBe('COMPLETA');
    expect(result.alertasBloqueantes).toHaveLength(0);
  });

  it('returns INCOMPLETA when garantias is undefined', () => {
    const result = computeValidation({ codigoPostal: '06600', giroId: 'GIR-015' });

    expect(result.estadoValidacion).toBe('INCOMPLETA');
  });

  it('returns INCOMPLETA when giroId is present but hasClaveIncendio is false', () => {
    const result = computeValidation({
      codigoPostal: '06600',
      giroId: 'GIR-099',
      garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 }],
      hasClaveIncendio: false,
    });

    expect(result.estadoValidacion).toBe('INCOMPLETA');
    expect(result.alertasBloqueantes).toContain(
      'El giro seleccionado no tiene tarifa de incendio asociada',
    );
  });
});
