import type { QuoteSummary, QuoteState } from '../types/quote.types';

interface QuoteCardProps {
  quote: QuoteSummary;
  onClick: () => void;
}

const ESTADO_BADGE: Record<QuoteState, { label: string; className: string }> = {
  EN_EDICION:                { label: 'En edición',             className: 'bg-slate-100 text-slate-600' },
  DATOS_GENERALES_COMPLETOS: { label: 'Datos generales',        className: 'bg-blue-100 text-blue-700' },
  UBICACIONES_CONFIGURADAS:  { label: 'Ubicaciones config.',    className: 'bg-blue-100 text-blue-700' },
  COBERTURAS_SELECCIONADAS:  { label: 'Coberturas selec.',      className: 'bg-yellow-100 text-yellow-700' },
  CALCULADA:                 { label: 'Calculada',              className: 'bg-green-100 text-green-700' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

export const QuoteCard = ({ quote, onClick }: QuoteCardProps) => {
  const badge = ESTADO_BADGE[quote.estadoCotizacion];

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 mb-0.5">Folio</p>
          <p className="font-bold text-slate-800 truncate">{quote.numeroFolio}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <p className="text-xs text-slate-400">Asegurado</p>
          <p className="text-slate-700 truncate">
            {quote.nombreAsegurado ?? <span className="italic text-slate-400">Sin datos generales</span>}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Prima neta</p>
          <p className="text-slate-700">
            {quote.primaNetaTotal != null
              ? formatCurrency(quote.primaNetaTotal)
              : <span className="italic text-slate-400">No calculada</span>}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-slate-400">Última actualización</p>
          <p className="text-slate-600">{formatDate(quote.fechaUltimaActualizacion)}</p>
        </div>
      </div>
    </button>
  );
};

export default QuoteCard;
