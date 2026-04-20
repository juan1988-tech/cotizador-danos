import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/atoms/Button';
import { Alert } from '../../../shared/components/atoms/Alert';
import { PageLayout } from '../../../shared/components/templates/PageLayout';
import { createQuote } from '../services/quoteApi';

export const QuoteListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNewQuote = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await createQuote();
      navigate(`/quotes/${data.numeroFolio}/general-info`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cotización');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Cotizaciones"
      subtitle="Gestiona tus cotizaciones de seguros de daños"
      maxWidth="2xl"
      actions={
        <Button onClick={handleNewQuote} loading={loading}>
          + Nueva Cotización
        </Button>
      }
    >
      {error && <Alert type="danger" className="mb-4">{error}</Alert>}

      <div className="mt-6 rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-700">No hay cotizaciones</h3>
        <p className="mt-2 text-sm text-slate-500">
          Inicia una nueva cotización para comenzar el proceso.
        </p>
        <div className="mt-6">
          <Button onClick={handleNewQuote} loading={loading}>
            + Nueva Cotización
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default QuoteListPage;
