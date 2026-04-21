import { useCatalogStore } from '../../../store/catalogStore';
import { Button } from '../../../shared/components/atoms/Button';
import { Card } from '../../../shared/components/molecules/Card';
import type { DatosAsegurado } from '../types/quote.types';

interface GeneralInfoViewProps {
  data: DatosAsegurado;
  onEdit?: () => void;
  onContinue?: () => void;
  canContinue?: boolean;
}

function resolveLabel(
  id: string | undefined,
  catalog: { id: string; descripcion: string }[],
): string {
  if (!id) return '—';
  return catalog.find((c) => c.id === id)?.descripcion ?? id;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface InfoFieldProps {
  label: string;
  value: string;
}

const InfoField = ({ label, value }: InfoFieldProps) => (
  <div>
    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
      {label}
    </dt>
    <dd className="mt-1 text-sm font-medium text-slate-900">{value || '—'}</dd>
  </div>
);

export const GeneralInfoView = ({
  data,
  onEdit,
  onContinue,
  canContinue = false,
}: GeneralInfoViewProps) => {
  const { agents, subscribers, giros } = useCatalogStore();

  return (
    <div className="space-y-4">
      <Card title="Datos del Asegurado" padding="lg">
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <InfoField
            label="Nombre del Asegurado"
            value={data.nombreAsegurado ?? '—'}
          />
          <InfoField label="RFC" value={data.rfcAsegurado ?? '—'} />
        </dl>
      </Card>

      <Card title="Datos del Contrato" padding="lg">
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <InfoField
            label="Agente"
            value={resolveLabel(data.agenteId, agents)}
          />
          <InfoField
            label="Suscriptor"
            value={resolveLabel(data.suscriptorId, subscribers)}
          />
          <InfoField
            label="Tipo de Negocio"
            value={data.tipoNegocio ?? '—'}
          />
          <InfoField
            label="Giro"
            value={resolveLabel(data.giroId, giros)}
          />
          <InfoField
            label="Vigencia — Inicio"
            value={formatDate(data.vigenciaInicio)}
          />
          <InfoField
            label="Vigencia — Fin"
            value={formatDate(data.vigenciaFin)}
          />
        </dl>
      </Card>

      <div className="flex items-center justify-between pt-2">
        <div>
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={onEdit}>
              Editar
            </Button>
          )}
        </div>
        <div>
          {canContinue && onContinue && (
            <Button variant="primary" onClick={onContinue}>
              Continuar a Ubicaciones
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneralInfoView;
