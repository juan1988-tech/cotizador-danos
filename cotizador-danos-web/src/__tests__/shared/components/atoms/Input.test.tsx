import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '../../../../shared/components/atoms/Input';

describe('Input', () => {
  // ─── Happy Path ──────────────────────────────────────────────────────────

  it('renders input element', () => {
    render(<Input />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Input label="Nombre" />);

    expect(screen.getByText('Nombre')).toBeInTheDocument();
  });

  it('renders placeholder', () => {
    render(<Input placeholder="Ingresa tu nombre" />);

    expect(screen.getByPlaceholderText('Ingresa tu nombre')).toBeInTheDocument();
  });

  it('calls onChange when value changes', async () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    await userEvent.type(screen.getByRole('textbox'), 'hola');

    expect(handleChange).toHaveBeenCalled();
  });

  it('displays the value provided', () => {
    render(<Input value="Juan Pérez" onChange={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue('Juan Pérez');
  });

  // ─── Error state ─────────────────────────────────────────────────────────

  it('shows error message when error prop provided', () => {
    render(<Input error="Campo requerido" />);

    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
  });

  it('applies error border class when error provided', () => {
    render(<Input error="Error" />);

    expect(screen.getByRole('textbox')).toHaveClass('border-danger-600');
  });

  it('applies normal border when no error', () => {
    render(<Input />);

    expect(screen.getByRole('textbox')).toHaveClass('border-gray-300');
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────

  it('does not render label element when label not provided', () => {
    render(<Input />);

    expect(screen.queryByRole('label')).not.toBeInTheDocument();
  });

  it('renders as disabled when disabled prop set', () => {
    render(<Input disabled />);

    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders type="number" correctly', () => {
    render(<Input type="number" />);

    expect(document.querySelector('input[type="number"]')).toBeInTheDocument();
  });
});
