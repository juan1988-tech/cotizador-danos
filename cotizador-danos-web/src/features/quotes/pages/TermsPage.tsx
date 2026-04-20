import { useParams } from 'react-router-dom';
import { PageLayout } from '../../../shared/components/templates/PageLayout';
import { Card } from '../../../shared/components/molecules/Card';
import { Alert } from '../../../shared/components/atoms/Alert';
import { PremiumResults } from '../../calculation/components/PremiumResults';
import { useQuoteStore } from '../../../store/quoteStore';

export const TermsPage = () => {
  const { folio } = useParams<{ folio: string }>();
  const { currentQuote } = useQuoteStore();

  const isCalculated = currentQuote?.estadoCotizacion === 'CALCULADA';

  return (
    <PageLayout
      title="Términos y Condiciones"
      subtitle="Resumen final y emisión de la cotización"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {!isCalculated && (
          <Alert type="warning">
            La cotización aún no ha sido calculada. Vuelve al paso anterior para ejecutar el cálculo.
          </Alert>
        )}

        {/* Resumen de datos generales */}
        {currentQuote?.datosAsegurado && (
          <Card title="Resumen de la Cotización">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Folio</dt>
                <dd className="font-semibold text-slate-800">{folio}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 mb-0.5">Estado</dt>
                <dd className="font-semibold text-slate-800">{currentQuote.estadoCotizacion}</dd>
              </div>
              {currentQuote.datosAsegurado.nombreAsegurado && (
                <div>
                  <dt className="text-xs text-slate-500 mb-0.5">Asegurado</dt>
                  <dd className="font-semibold text-slate-800">{currentQuote.datosAsegurado.nombreAsegurado}</dd>
                </div>
              )}
              {currentQuote.datosAsegurado.rfcAsegurado && (
                <div>
                  <dt className="text-xs text-slate-500 mb-0.5">RFC</dt>
                  <dd className="font-semibold text-slate-800">{currentQuote.datosAsegurado.rfcAsegurado}</dd>
                </div>
              )}
              {currentQuote.datosAsegurado.vigenciaInicio && (
                <div>
                  <dt className="text-xs text-slate-500 mb-0.5">Vigencia</dt>
                  <dd className="font-semibold text-slate-800">
                    {currentQuote.datosAsegurado.vigenciaInicio} — {currentQuote.datosAsegurado.vigenciaFin}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        )}

        {/* Resultados de cálculo */}
        {isCalculated &&
          currentQuote?.primaNetaTotal != null &&
          currentQuote?.primaComercialTotal != null && (
          <PremiumResults
            primaNetaTotal={currentQuote.primaNetaTotal}
            primaComercialTotal={currentQuote.primaComercialTotal}
            primasPorUbicacion={currentQuote.primasPorUbicacion ?? []}
          />
        )}

        {isCalculated && (
          <Card>
            <div className="text-center py-4 space-y-2">
              <div className="flex justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Cotización Lista</h3>
              <p className="text-sm text-slate-500">
                La cotización <strong>{folio}</strong> ha sido calculada correctamente.
              </p>
            </div>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default TermsPage;
