import { Button } from '../../../shared/components/atoms/Button';
import { Alert } from '../../../shared/components/atoms/Alert';

interface CalculationButtonProps {
  onCalculate: () => Promise<void>;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  completedCount: number;
  incompleteCount: number;
  className?: string;
}

export const CalculationButton = ({
  onCalculate,
  loading = false,
  error,
  disabled = false,
  completedCount,
  incompleteCount,
  className = '',
}: CalculationButtonProps) => {
  const hasNoValid = completedCount === 0;

  const handleClick = async () => {
    await onCalculate();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {error && (
        <Alert type="danger">{error}</Alert>
      )}

      {incompleteCount > 0 && completedCount > 0 && (
        <Alert type="warning">
          {incompleteCount} ubicación(es) incompleta(s) serán excluidas del cálculo.
        </Alert>
      )}

      {hasNoValid && (
        <Alert type="danger">
          No hay ubicaciones válidas para calcular. Complete al menos una ubicación.
        </Alert>
      )}

      <div className="flex items-center gap-4">
        <Button
          onClick={handleClick}
          loading={loading}
          disabled={disabled || hasNoValid}
          size="lg"
        >
          Calcular Prima
        </Button>
        {completedCount > 0 && (
          <span className="text-sm text-slate-600">
            Se calcularán <strong>{completedCount}</strong> ubicación(es)
          </span>
        )}
      </div>
    </div>
  );
};

export default CalculationButton;
