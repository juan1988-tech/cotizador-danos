import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LocationCard } from '../../../../features/locations/components/LocationCard';
import type { UbicacionResumen } from '../../../../features/locations/types/location.types';

const COMPLETE_LOCATION: UbicacionResumen = {
  indiceUbicacion: 1,
  descripcion: 'Oficina Principal',
  codigoPostal: '06700',
  giroId: 'G001',
  estadoValidacion: 'COMPLETA',
  alertasBloqueantes: [],
  garantias: [
    { tipoGarantia: 'INCENDIO', sumaAsegurada: 1000000 },
    { tipoGarantia: 'ROBO', sumaAsegurada: 500000 },
  ],
  version: 1,
};

const INCOMPLETE_LOCATION: UbicacionResumen = {
  indiceUbicacion: 2,
  descripcion: null,
  codigoPostal: null,
  giroId: null,
  estadoValidacion: 'INCOMPLETA',
  alertasBloqueantes: ['Código postal requerido'],
  garantias: [],
  version: 1,
};

describe('LocationCard', () => {
  // ─── Happy Path ──────────────────────────────────────────────────────────

  it('renders the location description', () => {
    render(<LocationCard location={COMPLETE_LOCATION} />);

    expect(screen.getByText('Oficina Principal')).toBeInTheDocument();
  });

  it('renders fallback name when descripcion is null', () => {
    render(<LocationCard location={INCOMPLETE_LOCATION} />);

    expect(screen.getByText('Ubicación 2')).toBeInTheDocument();
  });

  it('renders "Completa" badge for COMPLETA state', () => {
    render(<LocationCard location={COMPLETE_LOCATION} />);

    expect(screen.getByText('Completa')).toBeInTheDocument();
  });

  it('renders "Incompleta" badge for INCOMPLETA state', () => {
    render(<LocationCard location={INCOMPLETE_LOCATION} />);

    expect(screen.getByText('Incompleta')).toBeInTheDocument();
  });

  it('renders zip code when codigoPostal is set', () => {
    render(<LocationCard location={COMPLETE_LOCATION} />);

    expect(screen.getByText('06700')).toBeInTheDocument();
  });

  it('renders formatted total suma asegurada', () => {
    render(<LocationCard location={COMPLETE_LOCATION} />);

    // 1000000 + 500000 = 1500000 formatted as MXN
    expect(screen.getByText(/\$1,500,000\.00/)).toBeInTheDocument();
  });

  it('calls onEdit with the correct index when Edit button is clicked', async () => {
    const handleEdit = vi.fn();
    render(<LocationCard location={COMPLETE_LOCATION} onEdit={handleEdit} />);

    await userEvent.click(screen.getByRole('button', { name: /editar/i }));

    expect(handleEdit).toHaveBeenCalledWith(1);
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────

  it('does not render Edit button when onEdit is not provided', () => {
    render(<LocationCard location={COMPLETE_LOCATION} />);

    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
  });

  it('renders "No definido" placeholder when codigoPostal is null', () => {
    render(<LocationCard location={INCOMPLETE_LOCATION} />);

    expect(screen.getByText(/no definido/i)).toBeInTheDocument();
  });

  it('renders $0 when garantias list is empty', () => {
    render(<LocationCard location={INCOMPLETE_LOCATION} />);

    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('renders the index number in the badge', () => {
    render(<LocationCard location={COMPLETE_LOCATION} />);

    // The index badge shows "1"
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
