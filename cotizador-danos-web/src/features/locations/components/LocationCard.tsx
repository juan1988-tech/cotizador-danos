import type { UbicacionResumen } from '../types/location.types';
import { Button } from '../../../shared/components/atoms/Button';
import { Alert } from '../../../shared/components/atoms/Alert';

interface LocationCardProps {
  location: UbicacionResumen;
  onEdit?: (indice: number) => void;
  className?: string;
}

export const LocationCard = ({ location, onEdit, className = '' }: LocationCardProps) => {
  const isComplete = location.estadoValidacion === 'COMPLETA';
  const totalSuma = location.garantias.reduce((sum, g) => sum + g.sumaAsegurada, 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  return (
    <div
      className={`bg-white rounded-lg border-2 transition-colors ${
        isComplete ? 'border-green-200' : 'border-yellow-200'
      } ${className}`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between rounded-t-lg px-4 py-3 ${
          isComplete ? 'bg-green-50' : 'bg-yellow-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              isComplete ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
            }`}
          >
            {location.indiceUbicacion}
          </span>
          <span className="text-sm font-semibold text-slate-700">
            {location.descripcion || `Ubicación ${location.indiceUbicacion}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isComplete ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {isComplete ? 'Completa' : 'Incompleta'}
          </span>
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(location.indiceUbicacion)}
            >
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500 text-xs block">Código Postal</span>
            <span className="font-medium text-slate-700">
              {location.codigoPostal || <em className="text-slate-400">No definido</em>}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-xs block">Suma Asegurada Total</span>
            <span className="font-medium text-slate-700">
              {totalSuma > 0 ? formatCurrency(totalSuma) : <em className="text-slate-400">$0</em>}
            </span>
          </div>
        </div>

        {location.garantias.length > 0 && (
          <div>
            <span className="text-slate-500 text-xs block mb-1">Garantías ({location.garantias.length})</span>
            <div className="flex flex-wrap gap-1">
              {location.garantias.map((g) => (
                <span
                  key={g.tipoGarantia}
                  className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                >
                  {g.tipoGarantia}
                </span>
              ))}
            </div>
          </div>
        )}

        {location.alertasBloqueantes.length > 0 && (
          <Alert type="warning" className="mt-2">
            <ul className="list-disc list-inside space-y-0.5">
              {location.alertasBloqueantes.map((alerta, i) => (
                <li key={i} className="text-xs">{alerta}</li>
              ))}
            </ul>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default LocationCard;
