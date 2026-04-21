import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteListPage } from '../../../../features/quotes/pages/QuoteListPage';
import { useQuote } from '../../../../features/quotes/hooks/useQuote';
import type { UseQuoteReturn } from '../../../../features/quotes/hooks/useQuote';
import { useQuoteList } from '../../../../features/quotes/hooks/useQuoteList';
import type { UseQuoteListReturn } from '../../../../features/quotes/hooks/useQuoteList';
import type { QuoteSummary } from '../../../../features/quotes/types/quote.types';

vi.mock('../../../../features/quotes/hooks/useQuote');
vi.mock('../../../../features/quotes/hooks/useQuoteList');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const mockedUseQuote = vi.mocked(useQuote);
const mockedUseQuoteList = vi.mocked(useQuoteList);

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

const buildListReturn = (overrides: Partial<UseQuoteListReturn> = {}): UseQuoteListReturn => ({
  quotes: [],
  loading: false,
  error: null,
  refresh: vi.fn(),
  ...overrides,
});

const QUOTE_SUMMARY: QuoteSummary = {
  numeroFolio: 'COT-2026-001000',
  estadoCotizacion: 'CALCULADA',
  nombreAsegurado: 'María López',
  primaNetaTotal: 2500.5,
  fechaCreacion: '2026-04-20T00:00:00.000Z',
  fechaUltimaActualizacion: '2026-04-20T00:00:00.000Z',
};

describe('QuoteListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseQuote.mockReturnValue(buildHookReturn());
    mockedUseQuoteList.mockReturnValue(buildListReturn());
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

  // ─── List state ───────────────────────────────────────────────────────────

  it('renders QuoteCard for each returned summary', () => {
    mockedUseQuoteList.mockReturnValue(buildListReturn({ quotes: [QUOTE_SUMMARY] }));

    render(<QuoteListPage />);

    expect(screen.getByText('COT-2026-001000')).toBeInTheDocument();
    expect(screen.getByText('María López')).toBeInTheDocument();
  });

  it('hides empty state when quotes array is non-empty', () => {
    mockedUseQuoteList.mockReturnValue(buildListReturn({ quotes: [QUOTE_SUMMARY] }));

    render(<QuoteListPage />);

    expect(screen.queryByText('No hay cotizaciones')).not.toBeInTheDocument();
  });

  it('shows loading skeleton when list is loading', () => {
    mockedUseQuoteList.mockReturnValue(buildListReturn({ loading: true }));

    render(<QuoteListPage />);

    expect(screen.queryByText('No hay cotizaciones')).not.toBeInTheDocument();
    expect(screen.queryByText('COT-2026-001000')).not.toBeInTheDocument();
  });

  it('shows danger Alert when listError is set', () => {
    mockedUseQuoteList.mockReturnValue(buildListReturn({ error: 'Error al cargar cotizaciones' }));

    render(<QuoteListPage />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error al cargar cotizaciones')).toBeInTheDocument();
  });
});
