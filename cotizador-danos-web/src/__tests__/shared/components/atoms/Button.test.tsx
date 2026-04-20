import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../../../../shared/components/atoms/Button';

describe('Button', () => {
  // ─── Happy Path ──────────────────────────────────────────────────────────

  it('renders children text', () => {
    render(<Button>Guardar</Button>);

    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });

  it('applies primary variant styles by default', () => {
    render(<Button>Acción</Button>);

    expect(screen.getByRole('button')).toHaveClass('bg-primary-600');
  });

  it('applies secondary variant styles when variant="secondary"', () => {
    render(<Button variant="secondary">Cancelar</Button>);

    expect(screen.getByRole('button')).toHaveClass('bg-gray-200');
  });

  it('applies danger variant styles when variant="danger"', () => {
    render(<Button variant="danger">Eliminar</Button>);

    expect(screen.getByRole('button')).toHaveClass('bg-danger-600');
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders size sm with correct classes', () => {
    render(<Button size="sm">Pequeño</Button>);

    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5');
  });

  it('renders size lg with correct classes', () => {
    render(<Button size="lg">Grande</Button>);

    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3');
  });

  // ─── Loading state ───────────────────────────────────────────────────────

  it('shows "Cargando..." text when loading=true', () => {
    render(<Button loading>Guardar</Button>);

    expect(screen.getByRole('button')).toHaveTextContent('Cargando...');
  });

  it('is disabled when loading=true', () => {
    render(<Button loading>Guardar</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call onClick when loading', async () => {
    const handleClick = vi.fn();
    render(<Button loading onClick={handleClick}>Guardar</Button>);

    await userEvent.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  // ─── Disabled state ──────────────────────────────────────────────────────

  it('is disabled when disabled=true', () => {
    render(<Button disabled>Guardar</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Guardar</Button>);

    await userEvent.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────

  it('merges custom className with base styles', () => {
    render(<Button className="custom-class">Acción</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('font-medium');
  });
});
