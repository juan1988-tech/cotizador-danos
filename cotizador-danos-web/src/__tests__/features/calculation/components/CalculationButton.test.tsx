import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CalculationButton } from '../../../../features/calculation/components/CalculationButton';

describe('CalculationButton', () => {
  // ─── Happy Path ──────────────────────────────────────────────────────────

  it('renders the "Calcular Prima" button', () => {
    render(
      <CalculationButton onCalculate={vi.fn()} completedCount={2} incompleteCount={0} />
    );

    expect(screen.getByRole('button', { name: /calcular prima/i })).toBeInTheDocument();
  });

  it('shows count of valid locations when completedCount > 0', () => {
    render(
      <CalculationButton onCalculate={vi.fn()} completedCount={3} incompleteCount={0} />
    );

    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/ubicación\(es\)/i)).toBeInTheDocument();
  });

  it('calls onCalculate when button is clicked', async () => {
    const handleCalculate = vi.fn().mockResolvedValue(undefined);
    render(
      <CalculationButton onCalculate={handleCalculate} completedCount={1} incompleteCount={0} />
    );

    await userEvent.click(screen.getByRole('button', { name: /calcular prima/i }));

    expect(handleCalculate).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when loading=true', () => {
    render(
      <CalculationButton onCalculate={vi.fn()} loading completedCount={1} incompleteCount={0} />
    );

    expect(screen.getByRole('button')).toHaveTextContent('Cargando...');
  });

  // ─── Warning for incomplete locations ────────────────────────────────────

  it('shows warning when there are both complete and incomplete locations', () => {
    render(
      <CalculationButton onCalculate={vi.fn()} completedCount={2} incompleteCount={1} />
    );

    expect(screen.getByText(/incompleta\(s\) serán excluidas/i)).toBeInTheDocument();
  });

  it('does not show warning when all locations are complete', () => {
    render(
      <CalculationButton onCalculate={vi.fn()} completedCount={2} incompleteCount={0} />
    );

    expect(screen.queryByText(/incompleta\(s\) serán excluidas/i)).not.toBeInTheDocument();
  });

  // ─── Error state ─────────────────────────────────────────────────────────

  it('shows error alert when error prop is provided', () => {
    render(
      <CalculationButton
        onCalculate={vi.fn()}
        completedCount={1}
        incompleteCount={0}
        error="Error de cálculo"
      />
    );

    expect(screen.getByText('Error de cálculo')).toBeInTheDocument();
  });

  it('does not show error alert when error is null', () => {
    render(
      <CalculationButton onCalculate={vi.fn()} completedCount={1} incompleteCount={0} error={null} />
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // ─── No valid locations ───────────────────────────────────────────────────

  it('disables button when completedCount=0', () => {
    render(
      <CalculationButton onCalculate={vi.fn()} completedCount={0} incompleteCount={2} />
    );

    expect(screen.getByRole('button', { name: /calcular prima/i })).toBeDisabled();
  });

  it('shows "no valid locations" alert when completedCount=0', () => {
    render(
      <CalculationButton onCalculate={vi.fn()} completedCount={0} incompleteCount={1} />
    );

    expect(screen.getByText(/no hay ubicaciones válidas/i)).toBeInTheDocument();
  });

  it('disables button when disabled prop is true', () => {
    render(
      <CalculationButton onCalculate={vi.fn()} completedCount={1} incompleteCount={0} disabled />
    );

    expect(screen.getByRole('button', { name: /calcular prima/i })).toBeDisabled();
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────

  it('does not render count span when completedCount=0', () => {
    render(
      <CalculationButton onCalculate={vi.fn()} completedCount={0} incompleteCount={0} />
    );

    expect(screen.queryByText(/se calcularán/i)).not.toBeInTheDocument();
  });
});
