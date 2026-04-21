import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteListPage } from '../../../../features/quotes/pages/QuoteListPage';
import { useQuote } from '../../../../features/quotes/hooks/useQuote';
import type { UseQuoteReturn } from '../../../../features/quotes/hooks/useQuote';

vi.mock('../../../../features/quotes/hooks/useQuote');
const mockedUseQuote = vi.mocked(useQuote);

const buildHookReturn = (overrides: Partial<UseQuoteReturn> = {}): UseQuoteReturn => ({
  quote: null,
  loading: false,
  error: null,
  folio: undefined,
  loadQuote: vi.fn(),
  createNewQuote: vi.fn().mockResolvedValue('COT-2026-001000'),
  saveGeneralData: vi.fn(),
  ...overrides,
});

describe('QuoteListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseQuote.mockReturnValue(buildHookReturn());
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  it('renders the "Nueva Cotización" button', () => {
    render(<QuoteListPage />);

    const buttons = screen.getAllByRole('button', { name: /nueva cotización/i });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders the page title', () => {
    render(<QuoteListPage />);

    expect(screen.getByText('Cotizaciones')).toBeInTheDocument();
  });

  it('renders the empty state message', () => {
    render(<QuoteListPage />);

    expect(screen.getByText('No hay cotizaciones')).toBeInTheDocument();
  });

  // ─── Loading state ────────────────────────────────────────────────────────

  it('shows loading text and disables buttons when loading is true', () => {
    mockedUseQuote.mockReturnValue(buildHookReturn({ loading: true }));

    render(<QuoteListPage />);

    const loadingLabels = screen.getAllByText('Cargando...');
    expect(loadingLabels.length).toBeGreaterThan(0);

    screen.getAllByRole('button').forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  // ─── Error state ──────────────────────────────────────────────────────────

  it('shows danger Alert when error is set', () => {
    mockedUseQuote.mockReturnValue(
      buildHookReturn({ error: 'Error al crear la cotización' })
    );

    render(<QuoteListPage />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error al crear la cotización')).toBeInTheDocument();
  });

  it('does not show alert when error is null', () => {
    render(<QuoteListPage />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // ─── Interaction ──────────────────────────────────────────────────────────

  it('calls createNewQuote when the first button is clicked', async () => {
    const createNewQuoteMock = vi.fn().mockResolvedValue('COT-2026-001000');
    mockedUseQuote.mockReturnValue(buildHookReturn({ createNewQuote: createNewQuoteMock }));

    render(<QuoteListPage />);
    const user = userEvent.setup();

    const [firstButton] = screen.getAllByRole('button', { name: /nueva cotización/i });
    await user.click(firstButton!);

    expect(createNewQuoteMock).toHaveBeenCalledTimes(1);
  });

  it('calls createNewQuote when the empty-state button is clicked', async () => {
    const createNewQuoteMock = vi.fn().mockResolvedValue('COT-2026-001000');
    mockedUseQuote.mockReturnValue(buildHookReturn({ createNewQuote: createNewQuoteMock }));

    render(<QuoteListPage />);
    const user = userEvent.setup();

    const buttons = screen.getAllByRole('button', { name: /nueva cotización/i });
    const lastButton = buttons[buttons.length - 1]!;
    await user.click(lastButton);

    expect(createNewQuoteMock).toHaveBeenCalledTimes(1);
  });
});
