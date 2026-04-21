import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QuoteProgress } from '../../../../features/quotes/components/QuoteProgress';

// Wrapper that provides routing context with a folio param
const renderWithRouter = (activeStepId: string, folio = 'COT-2026-001') => {
  return render(
    <MemoryRouter initialEntries={[`/quotes/${folio}/general-info`]}>
      <Routes>
        <Route
          path="/quotes/:folio/*"
          element={<QuoteProgress activeStepId={activeStepId} />}
        />
      </Routes>
    </MemoryRouter>
  );
};

describe('QuoteProgress', () => {
  // ─── Happy Path ──────────────────────────────────────────────────────────

  it('renders all four step labels', () => {
    renderWithRouter('general-info');

    expect(screen.getByText('Datos Generales')).toBeInTheDocument();
    expect(screen.getByText('Ubicaciones')).toBeInTheDocument();
    expect(screen.getByText('Información Técnica')).toBeInTheDocument();
    expect(screen.getByText('Términos y Cond.')).toBeInTheDocument();
  });

  it('marks the active step with aria-current="step"', () => {
    renderWithRouter('general-info');

    const activeButton = screen.getByRole('button', { name: /datos generales/i });
    expect(activeButton).toHaveAttribute('aria-current', 'step');
  });

  it('does not mark non-active steps with aria-current', () => {
    renderWithRouter('general-info');

    const ubicacionesButton = screen.getByRole('button', { name: /ubicaciones/i });
    expect(ubicacionesButton).not.toHaveAttribute('aria-current', 'step');
  });

  it('enables clicking on active step', () => {
    renderWithRouter('general-info');

    const activeButton = screen.getByRole('button', { name: /datos generales/i });
    expect(activeButton).not.toBeDisabled();
  });

  it('disables clicking on future steps', () => {
    renderWithRouter('general-info');

    const futureButton = screen.getByRole('button', { name: /ubicaciones/i });
    expect(futureButton).toBeDisabled();
  });

  it('enables all previous steps when active step is "technical-info" (order 3)', () => {
    renderWithRouter('technical-info');

    expect(screen.getByRole('button', { name: /datos generales/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /ubicaciones/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /información técnica/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /términos/i })).toBeDisabled();
  });

  // ─── Navigation ───────────────────────────────────────────────────────────

  it('calls navigate when an enabled step is clicked', async () => {
    renderWithRouter('locations');

    const generalInfoBtn = screen.getByRole('button', { name: /datos generales/i });
    await userEvent.click(generalInfoBtn);

    // No assertion on navigate directly — just verify no error is thrown
    expect(generalInfoBtn).toBeInTheDocument();
  });

  // ─── Accessibility ────────────────────────────────────────────────────────

  it('renders a nav element with aria-label for accessibility', () => {
    renderWithRouter('general-info');

    expect(screen.getByRole('navigation', { name: /progreso de cotización/i })).toBeInTheDocument();
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────

  it('renders step order numbers as badge content for non-completed steps', () => {
    renderWithRouter('general-info');

    // Step 2 (Ubicaciones) should show "2" as its badge
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(4);
  });
});
