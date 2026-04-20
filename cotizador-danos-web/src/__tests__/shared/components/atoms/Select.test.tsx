import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Select } from '../../../../shared/components/atoms/Select';

const OPTIONS = [
  { value: 'op1', label: 'Opción 1' },
  { value: 'op2', label: 'Opción 2' },
  { value: 'op3', label: 'Opción 3' },
];

describe('Select', () => {
  // ─── Happy Path ──────────────────────────────────────────────────────────

  it('renders select element', () => {
    render(<Select options={OPTIONS} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders all provided options', () => {
    render(<Select options={OPTIONS} />);

    expect(screen.getByRole('option', { name: 'Opción 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Opción 2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Opción 3' })).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Select label="Tipo de Negocio" options={OPTIONS} />);

    expect(screen.getByText('Tipo de Negocio')).toBeInTheDocument();
  });

  it('renders placeholder option initially', () => {
    render(<Select options={OPTIONS} />);

    expect(screen.getByRole('option', { name: /selecciona una opción/i })).toBeInTheDocument();
  });

  it('shows the selected value', () => {
    render(<Select options={OPTIONS} value="op2" onChange={vi.fn()} />);

    expect(screen.getByRole('combobox')).toHaveValue('op2');
  });

  it('calls onChange when selection changes', async () => {
    const handleChange = vi.fn();
    render(<Select options={OPTIONS} onChange={handleChange} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), 'op1');

    expect(handleChange).toHaveBeenCalled();
  });

  // ─── Error state ─────────────────────────────────────────────────────────

  it('shows error message when error prop provided', () => {
    render(<Select options={OPTIONS} error="Selección inválida" />);

    expect(screen.getByText('Selección inválida')).toBeInTheDocument();
  });

  it('applies error border class when error provided', () => {
    render(<Select options={OPTIONS} error="Error" />);

    expect(screen.getByRole('combobox')).toHaveClass('border-danger-600');
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────

  it('renders empty options list without crashing', () => {
    render(<Select options={[]} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders disabled state correctly', () => {
    render(<Select options={OPTIONS} disabled />);

    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
