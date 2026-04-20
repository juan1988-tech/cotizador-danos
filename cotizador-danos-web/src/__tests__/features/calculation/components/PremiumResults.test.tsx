import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PremiumResults } from '../../../../features/calculation/components/PremiumResults';
import type { LocationPremium } from '../../../../features/calculation/types/calculation.types';

const LOCATION_PREMIUMS: LocationPremium[] = [
  { indiceUbicacion: 1, primaNeta: 10000, primaComercial: 11500, desglose: { INCENDIO: 10000 } },
  { indiceUbicacion: 2, primaNeta: 8000, primaComercial: 9200, desglose: {} },
];

describe('PremiumResults', () => {
  // ─── Happy Path ──────────────────────────────────────────────────────────

  it('renders prima neta total formatted as MXN currency', () => {
    render(
      <PremiumResults
        primaNetaTotal={18000}
        primaComercialTotal={20700}
        primasPorUbicacion={LOCATION_PREMIUMS}
      />
    );

    expect(screen.getByText(/\$18,000\.00/)).toBeInTheDocument();
  });

  it('renders prima comercial total formatted as MXN currency', () => {
    render(
      <PremiumResults
        primaNetaTotal={18000}
        primaComercialTotal={20700}
        primasPorUbicacion={LOCATION_PREMIUMS}
      />
    );

    expect(screen.getByText(/\$20,700\.00/)).toBeInTheDocument();
  });

  it('renders "Resultado del Cálculo" heading', () => {
    render(
      <PremiumResults
        primaNetaTotal={18000}
        primaComercialTotal={20700}
        primasPorUbicacion={LOCATION_PREMIUMS}
      />
    );

    expect(screen.getByText('Resultado del Cálculo')).toBeInTheDocument();
  });

  it('renders "Desglose por Ubicación" section when primasPorUbicacion has items', () => {
    render(
      <PremiumResults
        primaNetaTotal={18000}
        primaComercialTotal={20700}
        primasPorUbicacion={LOCATION_PREMIUMS}
      />
    );

    expect(screen.getByText(/desglose por ubicación/i)).toBeInTheDocument();
  });

  it('renders one LocationBreakdown per location', () => {
    render(
      <PremiumResults
        primaNetaTotal={18000}
        primaComercialTotal={20700}
        primasPorUbicacion={LOCATION_PREMIUMS}
      />
    );

    expect(screen.getByText('Ubicación 1')).toBeInTheDocument();
    expect(screen.getByText('Ubicación 2')).toBeInTheDocument();
  });

  // ─── Excluded locations ───────────────────────────────────────────────────

  it('shows excluded locations warning when ubicacionesExcluidas has values', () => {
    render(
      <PremiumResults
        primaNetaTotal={10000}
        primaComercialTotal={11500}
        primasPorUbicacion={[LOCATION_PREMIUMS[0]]}
        ubicacionesExcluidas={[2, 3]}
      />
    );

    expect(screen.getByText(/excluidas del cálculo/i)).toBeInTheDocument();
    expect(screen.getByText(/2, 3/)).toBeInTheDocument();
  });

  it('does not show excluded warning when ubicacionesExcluidas is empty', () => {
    render(
      <PremiumResults
        primaNetaTotal={18000}
        primaComercialTotal={20700}
        primasPorUbicacion={LOCATION_PREMIUMS}
        ubicacionesExcluidas={[]}
      />
    );

    expect(screen.queryByText(/excluidas del cálculo/i)).not.toBeInTheDocument();
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────

  it('does not render desglose section when primasPorUbicacion is empty', () => {
    render(
      <PremiumResults
        primaNetaTotal={0}
        primaComercialTotal={0}
        primasPorUbicacion={[]}
      />
    );

    expect(screen.queryByText(/desglose por ubicación/i)).not.toBeInTheDocument();
  });

  it('renders labels "Prima Neta Total" and "Prima Comercial Total"', () => {
    render(
      <PremiumResults
        primaNetaTotal={0}
        primaComercialTotal={0}
        primasPorUbicacion={[]}
      />
    );

    expect(screen.getByText('Prima Neta Total')).toBeInTheDocument();
    expect(screen.getByText('Prima Comercial Total')).toBeInTheDocument();
  });
});
