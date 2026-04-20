import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QuoteHeader } from '../../../../features/quotes/components/QuoteHeader';
import type { Quote } from '../../../../features/quotes/types/quote.types';

const BASE_QUOTE: Quote = {
  numeroFolio: 'COT-2026-001',
  estadoCotizacion: 'EN_EDICION',
  datosAsegurado: null,
  configuracionLayout: null,
  opcionesCobertura: null,
  version: 1,
  fechaCreacion: '2026-04-17T10:00:00.000Z',
  fechaUltimaActualizacion: '2026-04-17T10:00:00.000Z',
};

describe('QuoteHeader', () => {
  // ─── Happy Path ──────────────────────────────────────────────────────────

  it('renders the folio number', () => {
    render(<QuoteHeader quote={BASE_QUOTE} />);

    expect(screen.getByText(/COT-2026-001/)).toBeInTheDocument();
  });

  it('renders the "En Edición" label for EN_EDICION state', () => {
    render(<QuoteHeader quote={BASE_QUOTE} />);

    expect(screen.getByText('En Edición')).toBeInTheDocument();
  });

  it('renders "Calculada" label for CALCULADA state', () => {
    render(<QuoteHeader quote={{ ...BASE_QUOTE, estadoCotizacion: 'CALCULADA' }} />);

    expect(screen.getByText('Calculada')).toBeInTheDocument();
  });

  it('renders "Datos Completos" label for DATOS_GENERALES_COMPLETOS state', () => {
    render(<QuoteHeader quote={{ ...BASE_QUOTE, estadoCotizacion: 'DATOS_GENERALES_COMPLETOS' }} />);

    expect(screen.getByText('Datos Completos')).toBeInTheDocument();
  });

  it('renders the insured name when present in datosAsegurado', () => {
    const quote: Quote = {
      ...BASE_QUOTE,
      datosAsegurado: { nombreAsegurado: 'Empresa SA de CV' },
    };
    render(<QuoteHeader quote={quote} />);

    expect(screen.getByText('Empresa SA de CV')).toBeInTheDocument();
  });

  it('renders creation and update dates', () => {
    render(<QuoteHeader quote={BASE_QUOTE} />);

    // The dates are formatted, just check the labels appear
    expect(screen.getByText(/Creada:/)).toBeInTheDocument();
    expect(screen.getByText(/Actualizada:/)).toBeInTheDocument();
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────

  it('renders nothing when quote is null', () => {
    const { container } = render(<QuoteHeader quote={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('does not render insured name when datosAsegurado is null', () => {
    render(<QuoteHeader quote={BASE_QUOTE} />);

    // No name to display
    expect(screen.queryByText('Empresa SA de CV')).not.toBeInTheDocument();
  });
});
