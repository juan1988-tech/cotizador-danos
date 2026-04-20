import type { SelectHTMLAttributes, ReactNode } from 'react';

interface Option {
	value: string;
	label: ReactNode;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	options: Option[];
	error?: string;
}

export const Select = ({ label, options, error, className = '', ...props }: SelectProps) => {
	return (
		<div className="flex flex-col gap-1">
			{label && <label className="text-sm font-medium text-gray-700">{label}</label>}
			<select
				className={`border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-colors ${
					error ? 'border-danger-600' : 'border-gray-300'
				} ${className}`}
				{...props}
			>
				<option value="" disabled>Selecciona una opción</option>
				{options.map(opt => (
					<option key={opt.value} value={opt.value}>{opt.label}</option>
				))}
			</select>
			{error && <span className="text-xs text-danger-600 mt-1">{error}</span>}
		</div>
	);
};
