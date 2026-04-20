import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteForm } from '../../../../features/quotes/components/QuoteForm';
import type { DatosAsegurado } from '../../../../features/quotes/types/quote.types';

const AGENTS = [{ id: 'AG001', descripcion: 'Juan Pérez' }];
const SUBSCRIBERS = [{ id: 'SUB001', descripcion: 'Suscriptor Principal' }];

/**
 * Form field selectors based on actual DOM structure.
 * Labels are not associated via htmlFor/id, so we use placeholders and roles.
 *   combobox[0] = Agente
 *   combobox[1] = Suscriptor
 *   combobox[2] = Giro
 *   input[type="date"][0] = Vigencia Inicio
 *   input[type="date"][1] = Vigencia Fin
 */
const getFields = (container: HTMLElement) => ({
  nombre: screen.getByPlaceholderText(/razón social/i),
  rfc: screen.getByPlaceholderText(/XAXX/i),
  agente: screen.getAllByRole('combobox')[0] as HTMLSelectElement,
  suscriptor: screen.getAllByRole('combobox')[1] as HTMLSelectElement,
  vigenciaInicio: container.querySelectorAll('input[type="date"]')[0] as HTMLInputElement,
  vigenciaFin: container.querySelectorAll('input[type="date"]')[1] as HTMLInputElement,
});

/**
 * Set a controlled <select> value using the native setter instead of
 * fireEvent.change's Object.defineProperty override, which bypasses jsdom's
 * native value setter and therefore does not trigger React 19's onChange.
 */
const changeSelect = async (selectEl: HTMLSelectElement, value: string) => {
  await act(async () => {
    selectEl.value = value;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
  });
};

const changeInput = async (inputEl: HTMLInputElement, value: string) => {
  await act(async () => {
    fireEvent.change(inputEl, { target: { value } });
  });
};

/** Fill all required fields with valid data. */
const fillValidForm = async (container: HTMLElement) => {
  const f = getFields(container);
  await userEvent.type(f.nombre, 'Empresa Test SA');
  await userEvent.type(f.rfc, 'ETE840215K45');
  await changeSelect(f.agente, 'AG001');
  await changeSelect(f.suscriptor, 'SUB001');
  await changeInput(f.vigenciaInicio, '2026-01-01');
  await changeInput(f.vigenciaFin, '2027-01-01');
};

const INITIAL_DATA: DatosAsegurado = {
  nombreAsegurado: 'Empresa Test SA',
  rfcAsegurado: 'ETE840215K45',
  agenteId: '',
  suscriptorId: '',
  tipoNegocio: 'COMERCIAL',
  giroId: '',
  vigenciaInicio: '2026-01-01',
  vigenciaFin: '2027-01-01',
};

describe('QuoteForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Rendering ────────────────────────────────────────────────────────────

  it('renders the submit button', () => {
    render(<QuoteForm onSubmit={vi.fn()} />);

    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });

  it('renders required field inputs', () => {
    render(<QuoteForm onSubmit={vi.fn()} agents={AGENTS} subscribers={SUBSCRIBERS} />);

    expect(screen.getByPlaceholderText(/razón social/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/XAXX/i)).toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(3); // agente, suscriptor, giro
  });

  it('pre-fills text fields when initialData is provided', () => {
    render(
      <QuoteForm
        onSubmit={vi.fn()}
        initialData={INITIAL_DATA}
        agents={AGENTS}
        subscribers={SUBSCRIBERS}
      />
    );

    expect(screen.getByDisplayValue('Empresa Test SA')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ETE840215K45')).toBeInTheDocument();
  });

  it('shows error alert when error prop is provided', () => {
    render(<QuoteForm onSubmit={vi.fn()} error="Error del servidor" />);

    expect(screen.getByText('Error del servidor')).toBeInTheDocument();
  });

  // ─── Validation ───────────────────────────────────────────────────────────

  it('shows validation error when nombreAsegurado is empty on submit', async () => {
    render(<QuoteForm onSubmit={vi.fn()} agents={AGENTS} subscribers={SUBSCRIBERS} />);

    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    // Both Input and FormField may render the error — assert at least one appears
    expect(await screen.findAllByText(/nombre del asegurado es requerido/i)).not.toHaveLength(0);
  });

  it('shows RFC validation error when RFC format is invalid', async () => {
    const { container } = render(
      <QuoteForm onSubmit={vi.fn()} agents={AGENTS} subscribers={SUBSCRIBERS} />
    );
    const f = getFields(container);

    await userEvent.type(f.nombre, 'Empresa Test SA');
    await userEvent.type(f.rfc, 'INVALIDO');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findAllByText(/formato válido/i)).not.toHaveLength(0);
  });

  it('shows vigenciaFin error when fin is not after inicio', async () => {
    const { container } = render(
      <QuoteForm onSubmit={vi.fn()} agents={AGENTS} subscribers={SUBSCRIBERS} />
    );
    const f = getFields(container);

    await userEvent.type(f.nombre, 'Empresa Test SA');
    await userEvent.type(f.rfc, 'ETE840215K45');
    await changeSelect(f.agente, 'AG001');
    await changeSelect(f.suscriptor, 'SUB001');
    // Set fin BEFORE inicio (invalid range)
    await changeInput(f.vigenciaInicio, '2026-06-01');
    await changeInput(f.vigenciaFin, '2026-01-01');
    // Use fireEvent.submit to bypass pointer-event machinery
    await act(async () => {
      fireEvent.submit(container.querySelector('form')!);
    });

    expect(await screen.findAllByText(/posterior a la de inicio/i)).not.toHaveLength(0);
  });

  it('does not call onSubmit when form is invalid', async () => {
    const handleSubmit = vi.fn();
    render(<QuoteForm onSubmit={handleSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  // ─── Happy Path Submission ────────────────────────────────────────────────

  it('calls onSubmit when all required fields are filled', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <QuoteForm onSubmit={handleSubmit} agents={AGENTS} subscribers={SUBSCRIBERS} />
    );

    await fillValidForm(container);
    await act(async () => {
      fireEvent.submit(container.querySelector('form')!);
    });

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledOnce();
    });
  });

  it('clears field validation error when user starts typing', async () => {
    const { container } = render(
      <QuoteForm onSubmit={vi.fn()} agents={AGENTS} subscribers={SUBSCRIBERS} />
    );
    const f = getFields(container);

    // Trigger validation to show error
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(await screen.findAllByText(/nombre del asegurado es requerido/i)).not.toHaveLength(0);

    // Fixing the field clears its specific error
    await userEvent.type(f.nombre, 'A');

    await waitFor(() => {
      expect(screen.queryByText(/nombre del asegurado es requerido/i)).not.toBeInTheDocument();
    });
  });

  // ─── Loading state ────────────────────────────────────────────────────────

  it('disables submit button when loading=true', () => {
    render(<QuoteForm onSubmit={vi.fn()} loading />);

    expect(screen.getByRole('button', { name: /cargando/i })).toBeDisabled();
  });
});
