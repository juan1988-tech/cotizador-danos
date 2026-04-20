import type { Quote, QuoteState } from '../types/quote.types';

interface QuoteHeaderProps {
  quote: Quote | null;
  className?: string;
}

const STATE_LABELS: Record<QuoteState, string> = {
  EN_EDICION: 'En Edición',
  DATOS_GENERALES_COMPLETOS: 'Datos Completos',
  UBICACIONES_CONFIGURADAS: 'Ubicaciones OK',
  COBERTURAS_SELECCIONADAS: 'Coberturas OK',
  CALCULADA: 'Calculada',
};

const STATE_COLORS: Record<QuoteState, string> = {
  EN_EDICION: 'bg-yellow-100 text-yellow-800',
  DATOS_GENERALES_COMPLETOS: 'bg-blue-100 text-blue-800',
  UBICACIONES_CONFIGURADAS: 'bg-blue-100 text-blue-800',
  COBERTURAS_SELECCIONADAS: 'bg-blue-100 text-blue-800',
  CALCULADA: 'bg-green-100 text-green-800',
};

export const QuoteHeader = ({ quote, className = '' }: QuoteHeaderProps) => {
  if (!quote) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800">
              Cotización {quote.numeroFolio}
            </h2>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATE_COLORS[quote.estadoCotizacion]}`}
            >
              {STATE_LABELS[quote.estadoCotizacion]}
            </span>
          </div>
          {quote.datosAsegurado?.nombreAsegurado && (
            <p className="mt-1 text-sm text-slate-600">
              {quote.datosAsegurado.nombreAsegurado}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end text-sm text-slate-500">
          <span>Creada: {formatDate(quote.fechaCreacion)}</span>
          <span>Actualizada: {formatDate(quote.fechaUltimaActualizacion)}</span>
        </div>
      </div>
    </div>
  );
};

export default QuoteHeader;
