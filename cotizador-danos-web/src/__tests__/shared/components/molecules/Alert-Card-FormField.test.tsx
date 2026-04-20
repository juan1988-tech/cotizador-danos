import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Alert } from '../../../../shared/components/atoms/Alert';
import { Card } from '../../../../shared/components/molecules/Card';
import { FormField } from '../../../../shared/components/molecules/FormField';

// ─── Alert ───────────────────────────────────────────────────────────────────

describe('Alert', () => {
  it('renders children content', () => {
    render(<Alert>Mensaje de alerta</Alert>);

    expect(screen.getByText('Mensaje de alerta')).toBeInTheDocument();
  });

  it('has role="alert" for accessibility', () => {
    render(<Alert>Error crítico</Alert>);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('applies info styles by default', () => {
    render(<Alert>Info</Alert>);

    expect(screen.getByRole('alert')).toHaveClass('bg-blue-50', 'text-blue-800');
  });

  it('applies success styles when type="success"', () => {
    render(<Alert type="success">Guardado</Alert>);

    expect(screen.getByRole('alert')).toHaveClass('bg-green-50');
  });

  it('applies warning styles when type="warning"', () => {
    render(<Alert type="warning">Advertencia</Alert>);

    expect(screen.getByRole('alert')).toHaveClass('bg-yellow-50');
  });

  it('applies danger styles when type="danger"', () => {
    render(<Alert type="danger">Error</Alert>);

    expect(screen.getByRole('alert')).toHaveClass('bg-danger-50');
  });

  it('merges custom className', () => {
    render(<Alert className="mt-4">Alerta</Alert>);

    expect(screen.getByRole('alert')).toHaveClass('mt-4');
  });
});

// ─── Card ─────────────────────────────────────────────────────────────────────

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Contenido</Card>);

    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Card title="Mi Card">Contenido</Card>);

    expect(screen.getByText('Mi Card')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<Card title="Título" subtitle="Descripción">Contenido</Card>);

    expect(screen.getByText('Descripción')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(<Card footer={<button>Guardar</button>}>Contenido</Card>);

    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });

  it('applies elevated variant styles', () => {
    const { container } = render(<Card variant="elevated">Contenido</Card>);

    expect(container.firstChild).toHaveClass('shadow-lg');
  });

  it('applies outlined variant styles', () => {
    const { container } = render(<Card variant="outlined">Contenido</Card>);

    expect(container.firstChild).toHaveClass('border-2');
  });

  it('does not render header section when no title or subtitle', () => {
    render(<Card>Contenido</Card>);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});

// ─── FormField ────────────────────────────────────────────────────────────────

describe('FormField', () => {
  it('renders label text', () => {
    render(<FormField label="Nombre"><input /></FormField>);

    expect(screen.getByText('Nombre')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<FormField label="Campo"><input data-testid="input" /></FormField>);

    expect(screen.getByTestId('input')).toBeInTheDocument();
  });

  it('renders asterisk when required=true', () => {
    render(<FormField label="Nombre" required><input /></FormField>);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not render asterisk when required=false', () => {
    render(<FormField label="Nombre"><input /></FormField>);

    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders error message when error provided', () => {
    render(<FormField label="Nombre" error="Campo requerido"><input /></FormField>);

    expect(screen.getByRole('alert')).toHaveTextContent('Campo requerido');
  });

  it('renders hint text when hint provided and no error', () => {
    render(<FormField label="RFC" hint="Formato: XXXX000000000"><input /></FormField>);

    expect(screen.getByText('Formato: XXXX000000000')).toBeInTheDocument();
  });

  it('does not render hint when error is present', () => {
    render(
      <FormField label="RFC" hint="Formato..." error="Inválido">
        <input />
      </FormField>
    );

    expect(screen.queryByText('Formato...')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Inválido');
  });

  it('associates label with htmlFor', () => {
    render(<FormField label="Nombre" htmlFor="nombre-input"><input id="nombre-input" /></FormField>);

    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
  });
});
