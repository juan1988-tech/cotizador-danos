import { useNavigate, useParams } from 'react-router-dom';
import { CalculationButton } from '../../calculation/components/CalculationButton';
import { PremiumResults } from '../../calculation/components/PremiumResults';
import { Button } from '../../../shared/components/atoms/Button';
import { Alert } from '../../../shared/components/atoms/Alert';
import { Card } from '../../../shared/components/molecules/Card';
import { PageLayout } from '../../../shared/components/templates/PageLayout';
import { useCalculation } from '../../calculation/hooks/useCalculation';
import { useLocations } from '../../locations/hooks/useLocations';

export const TechnicalInfoPage = () => {
  const { folio } = useParams<{ folio: string }>();
  const navigate = useNavigate();
  const {
    coverageOptions,
    calculationResult,
    loading,
    error,
    toggleCoverage,
    saveCoverageOptions,
    calculate,
  } = useCalculation();
  const { getCompletedCount, getIncompleteCount } = useLocations();

  const handleSaveAndCalculate = async () => {
    await saveCoverageOptions();
    await calculate();
  };

  const handleContinue = () => {
    if (folio) {
      navigate(`/quotes/${folio}/terms-and-conditions`);
    }
  };

  return (
    <PageLayout
      title="Información Técnica"
      subtitle="Selección de coberturas y cálculo de prima"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {error && <Alert type="danger">{error}</Alert>}

        {/* Coberturas */}
        <Card title="Opciones de Cobertura">
          {coverageOptions.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              Cargando opciones de cobertura...
            </p>
          ) : (
            <div className="space-y-2">
              {coverageOptions.map((option) => (
                <label
                  key={option.codigoCobertura}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                    option.seleccionada ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'
                  } ${option.obligatoria ? 'opacity-80' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={option.seleccionada}
                    disabled={option.obligatoria}
                    onChange={(e) => toggleCoverage(option.codigoCobertura, e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-800">{option.descripcion}</span>
                    {option.obligatoria && (
                      <span className="ml-2 text-xs text-slate-500 italic">(obligatoria)</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{option.codigoCobertura}</span>
                </label>
              ))}
            </div>
          )}
        </Card>

        {/* Botón de cálculo */}
        <Card title="Calcular Prima">
          <CalculationButton
            onCalculate={handleSaveAndCalculate}
            loading={loading}
            error={null}
            completedCount={getCompletedCount()}
            incompleteCount={getIncompleteCount()}
          />
        </Card>

        {/* Resultados */}
        {calculationResult && (
          <PremiumResults
            primaNetaTotal={calculationResult.primaNetaTotal}
            primaComercialTotal={calculationResult.primaComercialTotal}
            primasPorUbicacion={calculationResult.primasPorUbicacion}
            ubicacionesExcluidas={calculationResult.ubicacionesExcluidas}
          />
        )}

        {/* Continuar */}
        {calculationResult && (
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <Button onClick={handleContinue}>
              Continuar a Términos →
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default TechnicalInfoPage;
