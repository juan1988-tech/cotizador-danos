import { useState, useEffect } from 'react';
import { Input } from '../../../shared/components/atoms/Input';
import { Select } from '../../../shared/components/atoms/Select';
import { Button } from '../../../shared/components/atoms/Button';
import { Alert } from '../../../shared/components/atoms/Alert';
import { FormField } from '../../../shared/components/molecules/FormField';
import type { DatosAsegurado } from '../types/quote.types';

interface QuoteFormProps {
  initialData?: DatosAsegurado | null;
  onSubmit: (data: DatosAsegurado) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  agents?: { id: string; descripcion: string }[];
  subscribers?: { id: string; descripcion: string }[];
  giros?: { id: string; descripcion: string }[];
}

export const QuoteForm = ({
  initialData,
  onSubmit,
  loading = false,
  error,
  agents = [],
  subscribers = [],
  giros = [],
}: QuoteFormProps) => {
  const [formData, setFormData] = useState<DatosAsegurado>({
    nombreAsegurado: '',
    rfcAsegurado: '',
    agenteId: '',
    suscriptorId: '',
    tipoNegocio: '',
    giroId: '',
    vigenciaInicio: '',
    vigenciaFin: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (field: keyof DatosAsegurado, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nombreAsegurado?.trim()) {
      errors.nombreAsegurado = 'El nombre del asegurado es requerido';
    }

    if (!formData.rfcAsegurado?.trim()) {
      errors.rfcAsegurado = 'El RFC es requerido';
    } else if (!/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i.test(formData.rfcAsegurado)) {
      errors.rfcAsegurado = 'El RFC no tiene un formato válido';
    }

    if (!formData.agenteId) {
      errors.agenteId = 'Seleccione un agente';
    }

    if (!formData.suscriptorId) {
      errors.suscriptorId = 'Seleccione un suscriptor';
    }

    if (!formData.vigenciaInicio) {
      errors.vigenciaInicio = 'La fecha de inicio es requerida';
    }

    if (!formData.vigenciaFin) {
      errors.vigenciaFin = 'La fecha de fin es requerida';
    } else if (formData.vigenciaInicio && formData.vigenciaFin <= formData.vigenciaInicio) {
      errors.vigenciaFin = 'La fecha de fin debe ser posterior a la de inicio';
    }

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
      {error && (
        <Alert type="danger">{error}</Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Nombre del Asegurado" required error={validationErrors.nombreAsegurado}>
          <Input
            value={formData.nombreAsegurado || ''}
            onChange={(e) => handleChange('nombreAsegurado', e.target.value)}
            placeholder="Razón social o nombre completo"
            error={validationErrors.nombreAsegurado}
          />
        </FormField>

        <FormField label="RFC" required error={validationErrors.rfcAsegurado}>
          <Input
            value={formData.rfcAsegurado || ''}
            onChange={(e) => handleChange('rfcAsegurado', e.target.value.toUpperCase())}
            placeholder="XAXX010101000"
            maxLength={13}
            error={validationErrors.rfcAsegurado}
          />
        </FormField>

        <FormField label="Agente" required error={validationErrors.agenteId}>
          <Select
            value={formData.agenteId || ''}
            onChange={(e) => handleChange('agenteId', e.target.value)}
            options={agents.map(a => ({ value: a.id, label: a.descripcion }))}
            error={validationErrors.agenteId}
          />
        </FormField>

        <FormField label="Suscriptor" required error={validationErrors.suscriptorId}>
          <Select
            value={formData.suscriptorId || ''}
            onChange={(e) => handleChange('suscriptorId', e.target.value)}
            options={subscribers.map(s => ({ value: s.id, label: s.descripcion }))}
            error={validationErrors.suscriptorId}
          />
        </FormField>

        <FormField label="Tipo de Negocio">
          <Input
            value={formData.tipoNegocio || ''}
            onChange={(e) => handleChange('tipoNegocio', e.target.value)}
            placeholder="Ej: Comercial, Industrial"
          />
        </FormField>

        <FormField label="Giro">
          <Select
            value={formData.giroId || ''}
            onChange={(e) => handleChange('giroId', e.target.value)}
            options={giros.map(g => ({ value: g.id, label: g.descripcion }))}
          />
        </FormField>

        <FormField label="Vigencia Inicio" required error={validationErrors.vigenciaInicio}>
          <Input
            type="date"
            value={formData.vigenciaInicio || ''}
            onChange={(e) => handleChange('vigenciaInicio', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            error={validationErrors.vigenciaInicio}
          />
        </FormField>

        <FormField label="Vigencia Fin" required error={validationErrors.vigenciaFin}>
          <Input
            type="date"
            value={formData.vigenciaFin || ''}
            onChange={(e) => handleChange('vigenciaFin', e.target.value)}
            min={formData.vigenciaInicio || new Date().toISOString().split('T')[0]}
            error={validationErrors.vigenciaFin}
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="submit" loading={loading}>
          Guardar y Continuar
        </Button>
      </div>
    </form>
  );
};

export default QuoteForm;
