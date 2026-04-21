import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { GeneralInfoView } from '../../../../features/quotes/components/GeneralInfoView';
import { useCatalogStore } from '../../../../store/catalogStore';
import type { DatosAsegurado } from '../../../../features/quotes/types/quote.types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FULL_DATA: DatosAsegurado = {
  nombreAsegurado: 'Empresa Test SA de CV',
  rfcAsegurado: 'ETE840215K45',
  agenteId: 'AGT-001',
  suscriptorId: 'SUB-001',
  tipoNegocio: 'Industrial',
  giroId: 'GIR-001',
  vigenciaInicio: '2026-01-01',
  vigenciaFin: '2027-01-01',
};

const AGENTS = [{ id: 'AGT-001', descripcion: 'Juan Pérez', codigo: 'A001' }];
const SUBSCRIBERS = [{ id: 'SUB-001', descripcion: 'Suscriptor Principal', codigo: 'S001' }];
const GIROS = [{ id: 'GIR-001', claveGiro: 'G001', descripcion: 'Comercial', claveIncendio: 'CI01' }];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function seedCatalog() {
  act(() => {
    useCatalogStore.setState({ agents: AGENTS, subscribers: SUBSCRIBERS, giros: GIROS });
  });
}

function clearCatalog() {
  act(() => {
    useCatalogStore.setState({ agents: [], subscribers: [], giros: [] });
  });
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('GeneralInfoView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCatalog();
  });

  // ─── Happy path — rendering all fields ───────────────────────────────────

  it('renders the insured name', () => {
    render(<GeneralInfoView data={FULL_DATA} />);

    expect(screen.getByText('Empresa Test SA de CV')).toBeInTheDocument();
  });

  it('renders the RFC', () => {
    render(<GeneralInfoView data={FULL_DATA} />);

    expect(screen.getByText('ETE840215K45')).toBeInTheDocument();
  });

  it('renders the tipo de negocio', () => {
    render(<GeneralInfoView data={FULL_DATA} />);

    expect(screen.getByText('Industrial')).toBeInTheDocument();
  });

  it('renders the "Datos del Asegurado" section title', () => {
    render(<GeneralInfoView data={FULL_DATA} />);

    expect(screen.getByText('Datos del Asegurado')).toBeInTheDocument();
  });

  it('renders the "Datos del Contrato" section title', () => {
    render(<GeneralInfoView data={FULL_DATA} />);

    expect(screen.getByText('Datos del Contrato')).toBeInTheDocument();
  });

  // ─── Catalog resolution ──────────────────────────────────────────────────

  it('resolves agenteId to agent description when catalog is loaded', () => {
    seedCatalog();
    render(<GeneralInfoView data={FULL_DATA} />);

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('resolves suscriptorId to subscriber description when catalog is loaded', () => {
    seedCatalog();
    render(<GeneralInfoView data={FULL_DATA} />);

    expect(screen.getByText('Suscriptor Principal')).toBeInTheDocument();
  });

  it('resolves giroId to giro description when catalog is loaded', () => {
    seedCatalog();
    render(<GeneralInfoView data={FULL_DATA} />);

    expect(screen.getByText('Comercial')).toBeInTheDocument();
  });

  // ─── Catalog fallback ────────────────────────────────────────────────────

  it('shows the raw agenteId when catalog is empty', () => {
    render(<GeneralInfoView data={FULL_DATA} />);

    expect(screen.getByText('AGT-001')).toBeInTheDocument();
  });

  it('shows the raw suscriptorId when catalog is empty', () => {
    render(<GeneralInfoView data={FULL_DATA} />);

    expect(screen.getByText('SUB-001')).toBeInTheDocument();
  });

  it('shows the raw giroId when catalog is empty', () => {
    render(<GeneralInfoView data={FULL_DATA} />);

    expect(screen.getByText('GIR-001')).toBeInTheDocument();
  });

  // ─── Undefined / null fields ─────────────────────────────────────────────

  it('shows dash for undefined nombreAsegurado', () => {
    render(<GeneralInfoView data={{ ...FULL_DATA, nombreAsegurado: undefined }} />);

    // The label is present; the value cell should show "—"
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('shows dash for undefined agenteId', () => {
    render(<GeneralInfoView data={{ ...FULL_DATA, agenteId: undefined }} />);

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('shows dash for undefined vigenciaInicio', () => {
    render(<GeneralInfoView data={{ ...FULL_DATA, vigenciaInicio: undefined }} />);

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  // ─── Vigencia formatting ─────────────────────────────────────────────────

  it('renders vigenciaInicio as a formatted date', () => {
    render(<GeneralInfoView data={FULL_DATA} />);

    // '2026-01-01' → formatted per es-MX locale; at minimum the year should appear
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  // ─── Actions — Editar button ─────────────────────────────────────────────

  it('renders the Editar button when onEdit is provided', () => {
    render(<GeneralInfoView data={FULL_DATA} onEdit={vi.fn()} />);

    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
  });

  it('calls onEdit when Editar button is clicked', async () => {
    const onEdit = vi.fn();
    render(<GeneralInfoView data={FULL_DATA} onEdit={onEdit} />);

    await userEvent.click(screen.getByRole('button', { name: /editar/i }));

    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('does not render Editar button when onEdit is not provided', () => {
    render(<GeneralInfoView data={FULL_DATA} />);

    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
  });

  // ─── Actions — Continuar button ──────────────────────────────────────────

  it('renders the Continuar button when canContinue is true and onContinue is provided', () => {
    render(<GeneralInfoView data={FULL_DATA} canContinue onContinue={vi.fn()} />);

    expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument();
  });

  it('calls onContinue when Continuar button is clicked', async () => {
    const onContinue = vi.fn();
    render(<GeneralInfoView data={FULL_DATA} canContinue onContinue={onContinue} />);

    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));

    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('does not render Continuar button when canContinue is false', () => {
    render(<GeneralInfoView data={FULL_DATA} canContinue={false} onContinue={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /continuar/i })).not.toBeInTheDocument();
  });

  it('does not render Continuar button when onContinue is not provided', () => {
    render(<GeneralInfoView data={FULL_DATA} canContinue />);

    expect(screen.queryByRole('button', { name: /continuar/i })).not.toBeInTheDocument();
  });
});
