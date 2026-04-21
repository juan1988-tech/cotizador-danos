import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LocationList } from '../components/LocationList';
import { LocationForm } from '../components/LocationForm';
import { Button } from '../../../shared/components/atoms/Button';
import { Alert } from '../../../shared/components/atoms/Alert';
import { Select } from '../../../shared/components/atoms/Select';
import { FormField } from '../../../shared/components/molecules/FormField';
import { PageLayout } from '../../../shared/components/templates/PageLayout';
import { Card } from '../../../shared/components/molecules/Card';
import { useLocations } from '../hooks/useLocations';
import { useQuoteStore } from '../../../store/quoteStore';
import { apiClient } from '../../../shared/services/apiClient';
import type { PatchLocationRequest } from '../types/location.types';

const NUM_UBICACIONES_OPTIONS = Array.from({ length: 50 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

export const LocationsPage = () => {
  const { folio } = useParams<{ folio: string }>();
  const navigate = useNavigate();
  const { currentQuote } = useQuoteStore();
  const {
    locations,
    loading,
    error,
    loadLocations,
    updateLocation,
    createLayout,
    getCompletedCount,
    getIncompleteCount,
  } = useLocations();

  const [giros, setGiros] = useState<{ id: string; descripcion: string }[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [layoutForm, setLayoutForm] = useState({
    tipoLayout: 'UNIFORME' as 'UNIFORME' | 'PERSONALIZADO',
    numeroUbicaciones: 1,
  });
  const [layoutSaving, setLayoutSaving] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ data: { id: string; descripcion: string }[] }>('/api/v1/catalogs/giros')
      .then((res) => setGiros(res.data.data))
      .catch(() => setGiros([]));
  }, []);

  const hasLayout = Boolean(currentQuote?.configuracionLayout);

  // Si ya hay layout, cargamos ubicaciones
  useEffect(() => {
    if (hasLayout && folio) {
      loadLocations();
    }
  }, [hasLayout, folio, loadLocations]);

  const handleSaveLayout = async () => {
    setLayoutSaving(true);
    try {
      await createLayout(layoutForm);
    } finally {
      setLayoutSaving(false);
    }
  };

  const handleSaveLocation = async (index: number, data: Omit<PatchLocationRequest, 'version'>) => {
    await updateLocation(index, data);
    setEditingIndex(null);
  };

  const handleContinue = () => {
    if (folio) {
      navigate(`/quotes/${folio}/technical-info`);
    }
  };

  const canContinue = getCompletedCount() > 0;

  return (
    <PageLayout title="Ubicaciones" subtitle="Configura las ubicaciones de riesgo" maxWidth="full">
      <div className="space-y-6">
        {error && <Alert type="danger">{error}</Alert>}

        {!hasLayout && (
          <Card title="Configurar Layout" subtitle="Define el número y tipo de ubicaciones">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Tipo de Layout" required>
                <Select
                  value={layoutForm.tipoLayout}
                  onChange={(e) =>
                    setLayoutForm(prev => ({
                      ...prev,
                      tipoLayout: e.target.value as 'UNIFORME' | 'PERSONALIZADO',
                    }))
                  }
                  options={[
                    { value: 'UNIFORME', label: 'Uniforme (todas iguales)' },
                    { value: 'PERSONALIZADO', label: 'Personalizado (independientes)' },
                  ]}
                />
              </FormField>
              <FormField label="Número de Ubicaciones" required>
                <Select
                  value={String(layoutForm.numeroUbicaciones)}
                  onChange={(e) =>
                    setLayoutForm(prev => ({
                      ...prev,
                      numeroUbicaciones: Number(e.target.value),
                    }))
                  }
                  options={NUM_UBICACIONES_OPTIONS}
                />
              </FormField>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSaveLayout} loading={layoutSaving}>
                Crear Ubicaciones
              </Button>
            </div>
          </Card>
        )}

        {/* Lista de ubicaciones */}
        {hasLayout && (
          <>
            {editingIndex !== null ? (
              <Card title={`Editar Ubicación ${editingIndex}`}>
                <LocationForm
                  indice={editingIndex}
                  initialData={
                    locations.find(l => l.indiceUbicacion === editingIndex)
                      ? {
                          descripcion: locations.find(l => l.indiceUbicacion === editingIndex)?.descripcion ?? '',
                          codigoPostal: locations.find(l => l.indiceUbicacion === editingIndex)?.codigoPostal ?? '',
                          giroId: locations.find(l => l.indiceUbicacion === editingIndex)?.giroId ?? '',
                          garantias: locations.find(l => l.indiceUbicacion === editingIndex)?.garantias ?? [],
                        }
                      : undefined
                  }
                  onSubmit={(data) => handleSaveLocation(editingIndex, data)}
                  onCancel={() => setEditingIndex(null)}
                  loading={loading}
                  error={error}
                  giros={giros}
                />
              </Card>
            ) : (
              <LocationList
                locations={locations}
                onEdit={setEditingIndex}
                loading={loading}
              />
            )}

            {!editingIndex && (
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <div className="text-sm text-slate-600">
                  {getCompletedCount()} completa(s) · {getIncompleteCount()} incompleta(s)
                </div>
                <Button
                  onClick={handleContinue}
                  disabled={!canContinue}
                  title={!canContinue ? 'Complete al menos una ubicación' : undefined}
                >
                  Continuar →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default LocationsPage;
