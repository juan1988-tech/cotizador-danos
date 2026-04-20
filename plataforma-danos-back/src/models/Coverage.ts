import { OpcionCobertura } from './Quote';

export interface OpcionCoberturaInput {
  codigoCobertura: string;
  seleccionada: boolean;
}

export const DEFAULT_COVERAGE_OPTIONS: OpcionCobertura[] = [
  {
    codigoCobertura: 'COB-001',
    descripcion: 'Incendio y/o Rayo',
    seleccionada: true,
    obligatoria: true,
  },
  {
    codigoCobertura: 'COB-002',
    descripcion: 'Catastrofe Natural',
    seleccionada: false,
    obligatoria: false,
  },
  {
    codigoCobertura: 'COB-003',
    descripcion: 'Interrupción de Negocio',
    seleccionada: false,
    obligatoria: false,
  },
];
