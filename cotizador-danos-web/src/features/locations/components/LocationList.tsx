import type { UbicacionResumen } from '../types/location.types';
import { LocationCard } from './LocationCard';
import { Alert } from '../../../shared/components/atoms/Alert';

interface LocationListProps {
  locations: UbicacionResumen[];
  onEdit?: (indice: number) => void;
  loading?: boolean;
  className?: string;
}

export const LocationList = ({
  locations,
  onEdit,
  loading = false,
  className = '',
}: LocationListProps) => {
  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-32 rounded-lg bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className={`py-12 text-center ${className}`}>
        <p className="text-slate-500 text-sm">No hay ubicaciones configuradas.</p>
        <p className="text-slate-400 text-xs mt-1">
          Configura el layout para agregar ubicaciones.
        </p>
      </div>
    );
  }

  const totalComplete = locations.filter(l => l.estadoValidacion === 'COMPLETA').length;
  const totalIncomplete = locations.filter(l => l.estadoValidacion === 'INCOMPLETA').length;
  const allIncomplete = totalComplete === 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Resumen */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-600">
          Total: <strong>{locations.length}</strong> ubicaciones
        </span>
        <span className="text-green-600">
          Completas: <strong>{totalComplete}</strong>
        </span>
        <span className="text-yellow-600">
          Incompletas: <strong>{totalIncomplete}</strong>
        </span>
      </div>

      {allIncomplete && (
        <Alert type="warning">
          Todas las ubicaciones están incompletas. Se requiere al menos una ubicación completa para calcular la prima.
        </Alert>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {locations.map((location) => (
          <LocationCard
            key={location.indiceUbicacion}
            location={location}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
};

export default LocationList;
