import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteHeader } from '../components/QuoteHeader';
import { QuoteForm } from '../components/QuoteForm';
import { Alert } from '../../../shared/components/atoms/Alert';
import { PageLayout } from '../../../shared/components/templates/PageLayout';
import { useQuote } from '../hooks/useQuote';

export const GeneralInfoPage = () => {
  const navigate = useNavigate();
  const { quote, loading, error, folio, loadQuote, saveGeneralData } = useQuote();

  useEffect(() => {
    if (folio && !quote) {
      loadQuote(folio);
    }
  }, [folio, quote, loadQuote]);

  const handleSubmit = async (data: Parameters<typeof saveGeneralData>[0]) => {
    await saveGeneralData(data);
    if (folio) {
      navigate(`/quotes/${folio}/locations`);
    }
  };

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

        <div className="rounded-lg bg-white border border-slate-200 p-6">
          <QuoteForm
            initialData={quote?.datosAsegurado}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default GeneralInfoPage;
