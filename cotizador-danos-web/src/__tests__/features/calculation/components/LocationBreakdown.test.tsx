import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LocationBreakdown } from '../../../../features/calculation/components/LocationBreakdown';
import type { LocationPremium } from '../../../../features/calculation/types/calculation.types';

const BASE_PREMIUM: LocationPremium = {
  indiceUbicacion: 1,
  primaNeta: 10000,
  primaComercial: 11500,
  desglose: {},
};

describe('LocationBreakdown', () => {
  // ─── Happy Path ──────────────────────────────────────────────────────────

  it('renders default title with index when no descripcion is provided', () => {
    render(<LocationBreakdown locationPremium={BASE_PREMIUM} />);

    expect(screen.getByText('Ubicación 1')).toBeInTheDocument();
  });

  it('renders custom descripcion when provided', () => {
    render(<LocationBreakdown locationPremium={BASE_PREMIUM} descripcion="Oficina Norte" />);

    expect(screen.getByText('Oficina Norte')).toBeInTheDocument();
  });

  it('renders formatted prima neta', () => {
    render(<LocationBreakdown locationPremium={BASE_PREMIUM} />);

    // MXN formatted value for 10000
    expect(screen.getByText(/\$10,000\.00/)).toBeInTheDocument();
  });

  it('renders formatted prima comercial', () => {
    render(<LocationBreakdown locationPremium={BASE_PREMIUM} />);

    expect(screen.getByText(/\$11,500\.00/)).toBeInTheDocument();
  });

  it('renders desglose entries when desglose has data', () => {
    const premium: LocationPremium = {
      ...BASE_PREMIUM,
      desglose: { INCENDIO: 5000, CAT_TEV: 3000 },
    };
    render(<LocationBreakdown locationPremium={premium} />);

    expect(screen.getByText('INCENDIO')).toBeInTheDocument();
    expect(screen.getByText('CAT_TEV')).toBeInTheDocument();
    expect(screen.getByText(/\$5,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$3,000\.00/)).toBeInTheDocument();
  });

  it('renders labels for prima neta and prima comercial', () => {
    render(<LocationBreakdown locationPremium={BASE_PREMIUM} />);

    expect(screen.getByText('Prima Neta')).toBeInTheDocument();
    expect(screen.getByText('Prima Comercial')).toBeInTheDocument();
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────

  it('does not render desglose section when desglose is empty', () => {
    render(<LocationBreakdown locationPremium={BASE_PREMIUM} />);

    expect(screen.queryByText('Desglose')).not.toBeInTheDocument();
  });

  it('renders zero amounts correctly', () => {
    const premium: LocationPremium = {
      ...BASE_PREMIUM,
      primaNeta: 0,
      primaComercial: 0,
    };
    render(<LocationBreakdown locationPremium={premium} />);

    const zeroAmounts = screen.getAllByText(/\$0\.00/);
    expect(zeroAmounts.length).toBeGreaterThanOrEqual(2);
  });
});
