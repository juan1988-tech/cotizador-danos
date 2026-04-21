import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteHeader } from '../components/QuoteHeader';
import { QuoteForm } from '../components/QuoteForm';
import { GeneralInfoView } from '../components/GeneralInfoView';
import { Alert } from '../../../shared/components/atoms/Alert';
import { PageLayout } from '../../../shared/components/templates/PageLayout';
import { useQuote } from '../hooks/useQuote';
import type { QuoteState } from '../types/quote.types';

const TEMP_AGENTS = [
  { id: 'AGT-001', descripcion: 'Juan Perez' },
  { id: 'AGT-002', descripcion: 'Maria Garcia' },
  { id: 'AGT-003', descripcion: 'Carlos Ramirez' },
];

const TEMP_SUBSCRIBERS = [
  { id: 'SUB-001', descripcion: 'Suscriptor Principal' },
  { id: 'SUB-002', descripcion: 'Suscriptor Secundario' },
];

const TEMP_GIROS = [
  { id: 'GIR-001', descripcion: 'Comercial' },
  { id: 'GIR-002', descripcion: 'Industrial' },
  { id: 'GIR-003', descripcion: 'Servicios' },
];

const CONTINUABLE_STATES: QuoteState[] = [
  'DATOS_GENERALES_COMPLETOS',
  'UBICACIONES_CONFIGURADAS',
  'COBERTURAS_SELECCIONADAS',
  'CALCULADA',
];

export const GeneralInfoPage = () => {
  const navigate = useNavigate();
  const { quote, loading, error, folio, loadQuote, saveGeneralData } = useQuote();
  const [mode, setMode] = useState<'view' | 'edit'>(() =>
    quote?.datosAsegurado ? 'view' : 'edit',
  );

  useEffect(() => {
    if (folio && !quote) {
      loadQuote(folio);
    }
  }, [folio, quote, loadQuote]);

  // Switch to edit mode when a freshly loaded quote has no datosAsegurado
  useEffect(() => {
    if (quote && !quote.datosAsegurado) {
      setMode('edit');
    }
  }, [quote]);

  const handleSubmit = async (data: Parameters<typeof saveGeneralData>[0]) => {
    await saveGeneralData(data);
    setMode('view');
  };

  const handleContinue = () => {
    if (folio) {
      navigate(`/quotes/${folio}/locations`);
    }
  };

  const canContinue = quote
    ? CONTINUABLE_STATES.includes(quote.estadoCotizacion)
    : false;

  if (loading && !quote) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <PageLayout title="Datos Generales" subtitle="Información del asegurado y del contrato" maxWidth="2xl">
      <div className="space-y-6">
        <QuoteHeader quote={quote} />

        {error && !loading && (
          <Alert type="danger">{error}</Alert>
        )}

        {mode === 'view' && quote?.datosAsegurado ? (
          <GeneralInfoView
            data={quote.datosAsegurado}
            onEdit={() => setMode('edit')}
            onContinue={handleContinue}
            canContinue={canContinue}
          />
        ) : (
          <div className="rounded-lg bg-white border border-slate-200 p-6">
            <QuoteForm
              initialData={quote?.datosAsegurado}
              onSubmit={handleSubmit}
              loading={loading}
              error={error}
              agents={TEMP_AGENTS}
              subscribers={TEMP_SUBSCRIBERS}
              giros={TEMP_GIROS}
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default GeneralInfoPage;
