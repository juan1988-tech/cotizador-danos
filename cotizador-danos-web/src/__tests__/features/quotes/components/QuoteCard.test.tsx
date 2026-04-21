import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { QuoteCard } from '../../../../features/quotes/components/QuoteCard';
import type { QuoteSummary } from '../../../../features/quotes/types/quote.types';

const BASE_SUMMARY: QuoteSummary = {
  numeroFolio: 'COT-2026-001000',
  estadoCotizacion: 'CALCULADA',
  nombreAsegurado: 'María López',
  primaNetaTotal: 2500.5,
  fechaCreacion: '2026-04-20T00:00:00.000Z',
  fechaUltimaActualizacion: '2026-04-20T00:00:00.000Z',
};

function renderCard(overrides: Partial<QuoteSummary> = {}, onClick = vi.fn()) {
  const quote = { ...BASE_SUMMARY, ...overrides };
  return { ...render(<QuoteCard quote={quote} onClick={onClick} />), onClick };
}

describe('QuoteCard', () => {
  it('renders the folio', () => {
    renderCard();
    expect(screen.getByText('COT-2026-001000')).toBeInTheDocument();
  });

  it('renders the badge label for CALCULADA state', () => {
    renderCard();
    expect(screen.getByText('Calculada')).toBeInTheDocument();
  });

  it('renders the badge label for EN_EDICION state', () => {
    renderCard({ estadoCotizacion: 'EN_EDICION' });
    expect(screen.getByText('En edición')).toBeInTheDocument();
  });

  it('renders nombreAsegurado when provided', () => {
    renderCard();
    expect(screen.getByText('María López')).toBeInTheDocument();
  });

  it('renders fallback when nombreAsegurado is null', () => {
    renderCard({ nombreAsegurado: null });
    expect(screen.getByText('Sin datos generales')).toBeInTheDocument();
  });

  it('renders formatted currency when primaNetaTotal is provided', () => {
    renderCard({ primaNetaTotal: 1000 });
    expect(screen.getByText(/\$1,000/)).toBeInTheDocument();
  });

  it('renders fallback when primaNetaTotal is null', () => {
    renderCard({ primaNetaTotal: null });
    expect(screen.getByText('No calculada')).toBeInTheDocument();
  });

  it('renders formatted date DD/MM/YYYY', () => {
    renderCard({ fechaUltimaActualizacion: '2026-04-20T12:00:00.000Z' });
    // The date is rendered as local time; we just verify the format pattern DD/MM/YYYY
    expect(screen.getByText(/\d{2}\/\d{2}\/2026/)).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    const onClick = vi.fn();
    renderCard({}, onClick);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
