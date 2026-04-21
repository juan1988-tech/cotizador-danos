import type { LocationPremium } from '../types/calculation.types';
import { LocationBreakdown } from './LocationBreakdown';
import { Alert } from '../../../shared/components/atoms/Alert';

interface PremiumResultsProps {
  primaNetaTotal: number;
  primaComercialTotal: number;
  primasPorUbicacion: LocationPremium[];
  ubicacionesExcluidas?: number[];
  className?: string;
}

export const PremiumResults = ({
  primaNetaTotal,
  primaComercialTotal,
  primasPorUbicacion,
  ubicacionesExcluidas = [],
  className = '',
}: PremiumResultsProps) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Totales globales */}
      <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Resultado del Cálculo</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-slate-500 mb-2">Prima Neta Total</p>
            <p className="text-3xl font-bold text-slate-800">
              {formatCurrency(primaNetaTotal)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <p className="text-sm text-slate-500 mb-2">Prima Comercial Total</p>
            <p className="text-3xl font-bold text-blue-700">
              {formatCurrency(primaComercialTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Ubicaciones excluidas */}
      {ubicacionesExcluidas.length > 0 && (
        <Alert type="warning">
          Las siguientes ubicaciones fueron excluidas del cálculo por estar incompletas:{' '}
          <strong>{ubicacionesExcluidas.join(', ')}</strong>.
        </Alert>
      )}

      {/* Desglose por ubicación */}
      {primasPorUbicacion.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Desglose por Ubicación
          </h4>
          {primasPorUbicacion.map((locPremium) => (
            <LocationBreakdown
              key={locPremium.indiceUbicacion}
              locationPremium={locPremium}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PremiumResults;
