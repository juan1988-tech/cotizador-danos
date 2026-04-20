import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LocationList } from '../../../../features/locations/components/LocationList';
import type { UbicacionResumen } from '../../../../features/locations/types/location.types';

const COMPLETE: UbicacionResumen = {
  indiceUbicacion: 1,
  descripcion: 'Oficina Norte',
  codigoPostal: '06700',
  giroId: 'G001',
  estadoValidacion: 'COMPLETA',
  alertasBloqueantes: [],
  garantias: [{ tipoGarantia: 'INCENDIO', sumaAsegurada: 500000 }],
  version: 1,
};

const INCOMPLETE: UbicacionResumen = {
  indiceUbicacion: 2,
  descripcion: null,
  codigoPostal: null,
  giroId: null,
  estadoValidacion: 'INCOMPLETA',
  alertasBloqueantes: ['Falta código postal'],
  garantias: [],
  version: 1,
};

describe('LocationList', () => {
  // ─── Loading state ────────────────────────────────────────────────────────

  it('renders skeleton placeholders when loading=true', () => {
    const { container } = render(
      <LocationList locations={[]} loading />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('does not render location cards while loading', () => {
    render(<LocationList locations={[COMPLETE]} loading />);

    expect(screen.queryByText('Oficina Norte')).not.toBeInTheDocument();
  });

  // ─── Empty state ──────────────────────────────────────────────────────────

  it('renders empty state message when locations is empty and not loading', () => {
    render(<LocationList locations={[]} />);

    expect(screen.getByText(/no hay ubicaciones configuradas/i)).toBeInTheDocument();
  });

  // ─── Happy Path ───────────────────────────────────────────────────────────

  it('renders all location cards', () => {
    render(<LocationList locations={[COMPLETE, INCOMPLETE]} />);

    expect(screen.getByText('Oficina Norte')).toBeInTheDocument();
    expect(screen.getByText('Ubicación 2')).toBeInTheDocument();
  });

  it('renders summary showing total, complete and incomplete counts', () => {
    render(<LocationList locations={[COMPLETE, INCOMPLETE]} />);

    expect(screen.getAllByText(/total/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/completas/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/incompletas/i).length).toBeGreaterThan(0);
  });

  it('shows count of 2 total locations', () => {
    render(<LocationList locations={[COMPLETE, INCOMPLETE]} />);

    // The summary has "Total: 2 ubicaciones"
    expect(screen.getByText(/total:/i).closest('span')).toHaveTextContent('2');
  });

  it('shows warning when all locations are incomplete', () => {
    render(<LocationList locations={[INCOMPLETE]} />);

    expect(screen.getByText(/todas las ubicaciones están incompletas/i)).toBeInTheDocument();
  });

  it('does not show warning when at least one location is complete', () => {
    render(<LocationList locations={[COMPLETE, INCOMPLETE]} />);

    expect(screen.queryByText(/todas las ubicaciones están incompletas/i)).not.toBeInTheDocument();
  });

  // ─── User interactions ────────────────────────────────────────────────────

  it('calls onEdit with the correct index when Editar is clicked', async () => {
    const handleEdit = vi.fn();
    render(<LocationList locations={[COMPLETE]} onEdit={handleEdit} />);

    await userEvent.click(screen.getByRole('button', { name: /editar/i }));

    expect(handleEdit).toHaveBeenCalledWith(1);
  });
});
