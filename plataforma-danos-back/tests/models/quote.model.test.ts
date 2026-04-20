import { maxEstado, ESTADO_ORDER } from '../../src/models/Quote';

describe('Quote model', () => {
  describe('ESTADO_ORDER', () => {
    it('EN_EDICION has the lowest order', () => {
      expect(ESTADO_ORDER['EN_EDICION']).toBe(0);
    });

    it('CALCULADA has the highest order', () => {
      expect(ESTADO_ORDER['CALCULADA']).toBe(4);
    });

    it('defines all 5 valid states', () => {
      const states = Object.keys(ESTADO_ORDER);
      expect(states).toHaveLength(5);
      expect(states).toContain('EN_EDICION');
      expect(states).toContain('DATOS_GENERALES_COMPLETOS');
      expect(states).toContain('UBICACIONES_CONFIGURADAS');
      expect(states).toContain('COBERTURAS_SELECCIONADAS');
      expect(states).toContain('CALCULADA');
    });
  });

  describe('maxEstado', () => {
    it('returns the higher state when a is greater than b', () => {
      expect(maxEstado('CALCULADA', 'EN_EDICION')).toBe('CALCULADA');
    });

    it('returns the higher state when b is greater than a', () => {
      expect(maxEstado('EN_EDICION', 'DATOS_GENERALES_COMPLETOS')).toBe(
        'DATOS_GENERALES_COMPLETOS',
      );
    });

    it('returns the same state when both are equal', () => {
      expect(maxEstado('UBICACIONES_CONFIGURADAS', 'UBICACIONES_CONFIGURADAS')).toBe(
        'UBICACIONES_CONFIGURADAS',
      );
    });
  });
});
