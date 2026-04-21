import { useState, useEffect } from 'react';
import { Input } from '../../../shared/components/atoms/Input';
import { Select } from '../../../shared/components/atoms/Select';
import { Button } from '../../../shared/components/atoms/Button';
import { Alert } from '../../../shared/components/atoms/Alert';
import { FormField } from '../../../shared/components/molecules/FormField';
import type { PatchLocationRequest, GarantiaResumen } from '../types/location.types';

const TIPOS_GARANTIA = [
  { value: 'INCENDIO', label: 'Incendio' },
  { value: 'ROBO', label: 'Robo' },
  { value: 'VIDRIO', label: 'Vidrio' },
  { value: 'RC', label: 'Responsabilidad Civil' },
  { value: 'EQUIPO_ELECTRONICO', label: 'Equipo Electrónico' },
  { value: 'MAQUINARIA', label: 'Maquinaria' },
];

interface LocationFormProps {
  indice: number;
  initialData?: Partial<PatchLocationRequest>;
  onSubmit: (data: Omit<PatchLocationRequest, 'version'>) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
  giros?: { id: string; descripcion: string }[];
}

export const LocationForm = ({
  indice,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  error,
  giros = [],
}: LocationFormProps) => {
  const [formData, setFormData] = useState({
    descripcion: '',
    direccion: '',
    codigoPostal: '',
    estado: '',
    municipio: '',
    colonia: '',
    giroId: '',
    garantias: [] as GarantiaResumen[],
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => ({
        ...prev,
        descripcion: initialData.descripcion ?? '',
        direccion: initialData.direccion ?? '',
        codigoPostal: initialData.codigoPostal ?? '',
        estado: initialData.estado ?? '',
        municipio: initialData.municipio ?? '',
        colonia: initialData.colonia ?? '',
        giroId: initialData.giroId ?? '',
        garantias: initialData.garantias ?? [],
      }));
    }
  }, [initialData]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const addGarantia = () => {
    setFormData(prev => ({
      ...prev,
      garantias: [...prev.garantias, { tipoGarantia: 'INCENDIO', sumaAsegurada: 0 }],
    }));
  };

  const updateGarantia = (index: number, field: keyof GarantiaResumen, value: string | number) => {
    setFormData(prev => {
      const garantias = [...prev.garantias];
      const garantia = garantias[index];
      if (garantia) {
        garantias[index] = { ...garantia, [field]: value };
      }
      return { ...prev, garantias };
    });
  };

  const removeGarantia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      garantias: prev.garantias.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.codigoPostal.trim()) {
      errors.codigoPostal = 'El código postal es requerido';
    } else if (!/^\d{6}$/.test(formData.codigoPostal.trim())) {
      errors.codigoPostal = 'El código postal debe contener exactamente 6 dígitos';
    }
    if (!formData.giroId) errors.giroId = 'Seleccione un giro';
    if (formData.garantias.length === 0) errors.garantias = 'Agregue al menos una garantía';
    const invalidSumas = formData.garantias.some(g => g.sumaAsegurada <= 0);
    if (invalidSumas) errors.garantias = 'Todas las sumas aseguradas deben ser mayores a 0';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert type="danger">{error}</Alert>}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Ubicación {indice}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Nombre de Ubicación">
          <Input
            value={formData.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            placeholder="Ej: Bodega Principal"
          />
        </FormField>

        <FormField label="Código Postal" required error={validationErrors.codigoPostal}>
          <Input
            value={formData.codigoPostal}
            onChange={(e) => handleChange('codigoPostal', e.target.value)}
            placeholder="000000"
            maxLength={6}
            error={validationErrors.codigoPostal}
          />
        </FormField>

        <FormField label="Estado">
          <Input
            value={formData.estado}
            onChange={(e) => handleChange('estado', e.target.value)}
            placeholder="Ej: Bogotá"
          />
        </FormField>

        <FormField label="Municipio / Alcaldía">
          <Input
            value={formData.municipio}
            onChange={(e) => handleChange('municipio', e.target.value)}
            placeholder="Ej: Chapinero"
          />
        </FormField>

        <FormField label="Dirección" className="md:col-span-2">
          <Input
            value={formData.direccion}
            onChange={(e) => handleChange('direccion', e.target.value)}
            placeholder="Calle, número, colonia"
          />
        </FormField>

        <FormField label="Giro" required error={validationErrors.giroId}>
          <Select
            value={formData.giroId}
            onChange={(e) => handleChange('giroId', e.target.value)}
            options={giros.map(g => ({ value: g.id, label: g.descripcion }))}
            error={validationErrors.giroId}
          />
        </FormField>
      </div>

      {/* Garantías */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">Garantías</h4>
          <Button type="button" variant="secondary" size="sm" onClick={addGarantia}>
            + Agregar Garantía
          </Button>
        </div>

        {validationErrors.garantias && (
          <p className="text-xs text-red-600">{validationErrors.garantias}</p>
        )}

        {formData.garantias.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
            No hay garantías agregadas
          </p>
        ) : (
          <div className="space-y-2">
            {formData.garantias.map((garantia, index) => (
              <div key={index} className="flex items-end gap-3 p-3 bg-slate-50 rounded-lg">
                <FormField label="Tipo" className="flex-1">
                  <Select
                    value={garantia.tipoGarantia}
                    onChange={(e) => updateGarantia(index, 'tipoGarantia', e.target.value)}
                    options={TIPOS_GARANTIA}
                  />
                </FormField>
                <FormField label="Suma Asegurada" className="flex-1">
                  <Input
                    type="number"
                    min={1}
                    value={garantia.sumaAsegurada || ''}
                    onChange={(e) => updateGarantia(index, 'sumaAsegurada', Number(e.target.value))}
                    placeholder="0.00"
                  />
                </FormField>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeGarantia(index)}
                  className="mb-0.5"
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading}>
          Guardar Ubicación
        </Button>
      </div>
    </form>
  );
};

export default LocationForm;
