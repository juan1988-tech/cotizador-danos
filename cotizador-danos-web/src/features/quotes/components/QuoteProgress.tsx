import { useNavigate, useParams } from 'react-router-dom';
import { QUOTE_STEPS } from '../types/quote.types';
import type { QuoteStepStatus } from '../types/quote.types';

interface QuoteProgressProps {
  activeStepId: string;
}

function getStepStatus(stepOrder: number, activeOrder: number): QuoteStepStatus {
  if (stepOrder === activeOrder) return 'active';
  if (stepOrder < activeOrder) return 'completed';
  return 'pending';
}

const STATUS_STYLES: Record<QuoteStepStatus, string> = {
  active:    'bg-blue-600 text-white border-blue-600',
  completed: 'bg-green-500 text-white border-green-500',
  pending:   'bg-white text-slate-400 border-slate-300',
};

const LABEL_STYLES: Record<QuoteStepStatus, string> = {
  active:    'text-blue-700 font-semibold',
  completed: 'text-slate-700 font-medium',
  pending:   'text-slate-400 font-normal',
};

export const QuoteProgress = ({ activeStepId }: QuoteProgressProps) => {
  const { folio } = useParams<{ folio: string }>();
  const navigate = useNavigate();
  const activeOrder = QUOTE_STEPS.find((s) => s.id === activeStepId)?.order ?? 1;

  const handleNavigate = (stepPath: string, stepOrder: number) => {
    if (stepOrder <= activeOrder && folio) {
      navigate(`/quotes/${folio}/${stepPath}`);
    }
  };

  return (
    <nav aria-label="Progreso de cotización" className="flex flex-col gap-2 px-4 py-6">
      {QUOTE_STEPS.map((step, index) => {
        const status = getStepStatus(step.order, activeOrder);
        const isClickable = step.order <= activeOrder;

        return (
          <div key={step.id} className="flex flex-col">
            <button
              type="button"
              disabled={!isClickable}
              aria-current={status === 'active' ? 'step' : undefined}
              onClick={() => handleNavigate(step.path, step.order)}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                isClickable ? 'cursor-pointer hover:bg-slate-100' : 'cursor-default',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
                  STATUS_STYLES[status],
                ].join(' ')}
              >
                {status === 'completed' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.order
                )}
              </span>
              <span className={`text-sm ${LABEL_STYLES[status]}`}>{step.label}</span>
            </button>

            {index < QUOTE_STEPS.length - 1 && (
              <div
                className={[
                  'ml-5.5 h-6 w-0.5',
                  step.order < activeOrder ? 'bg-green-400' : 'bg-slate-200',
                ].join(' ')}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default QuoteProgress;

