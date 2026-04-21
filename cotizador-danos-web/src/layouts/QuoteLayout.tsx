import { Outlet, useLocation, useParams } from 'react-router-dom';
import { QuoteProgress } from '../features/quotes/components/QuoteProgress';
import { QUOTE_STEPS } from '../features/quotes/types/quote.types';

function resolveActiveStep(pathname: string): string {
  const match = QUOTE_STEPS.find((s) => pathname.includes(s.path));
  return match?.id ?? QUOTE_STEPS[0]!.id;
}

export const QuoteLayout = () => {
  const { folio } = useParams<{ folio: string }>();
  const { pathname } = useLocation();
  const activeStepId = resolveActiveStep(pathname);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cotizador</p>
            <p className="text-sm font-bold text-slate-800">Seguros de Daños</p>
          </div>
        </div>

        {/* Folio badge */}
        {folio && (
          <div className="mx-4 mt-4 rounded-md bg-blue-50 px-3 py-2">
            <p className="text-xs text-blue-500">Folio</p>
            <p className="truncate text-sm font-semibold text-blue-700">{folio}</p>
          </div>
        )}

        {/* Step progress */}
        <div className="flex-1 overflow-y-auto">
          <QuoteProgress activeStepId={activeStepId} />
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4">
          <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} Seguros de Daños</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-auto">
        <div className="flex-1 px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default QuoteLayout;

