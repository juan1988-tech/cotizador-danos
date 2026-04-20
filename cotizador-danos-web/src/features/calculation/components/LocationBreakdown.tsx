import type { LocationPremium } from '../types/calculation.types';
import { Card } from '../../../shared/components/molecules/Card';

interface LocationBreakdownProps {
  locationPremium: LocationPremium;
  descripcion?: string;
  className?: string;
}

export const LocationBreakdown = ({
  locationPremium,
  descripcion,
  className = '',
}: LocationBreakdownProps) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const desgloseEntries = Object.entries(locationPremium.desglose);

  return (
    <Card
      title={descripcion || `Ubicación ${locationPremium.indiceUbicacion}`}
      variant="outlined"
      className={className}
    >
      <div className="space-y-3">
        {/* Totales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Prima Neta</p>
            <p className="text-lg font-bold text-slate-800">
              {formatCurrency(locationPremium.primaNeta)}
            </p>
          </div>
          <div className="rounded-md bg-blue-50 p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Prima Comercial</p>
            <p className="text-lg font-bold text-blue-700">
              {formatCurrency(locationPremium.primaComercial)}
            </p>
          </div>
        </div>

        {/* Desglose por componente */}
        {desgloseEntries.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Desglose</p>
            <div className="space-y-1">
              {desgloseEntries.map(([key, value]) => (
                <div key={key} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">{key}</span>
                  <span className="font-medium text-slate-800">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LocationBreakdown;
