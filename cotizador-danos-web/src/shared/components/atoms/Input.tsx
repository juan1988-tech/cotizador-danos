import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
}

export const Input = ({ label, error, className = '', ...props }: InputProps) => {
	return (
		<div className="flex flex-col gap-1">
			{label && <label className="text-sm font-medium text-gray-700">{label}</label>}
			<input
				className={`border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-colors ${
					error ? 'border-danger-600' : 'border-gray-300'
				} ${className}`}
				{...props}
			/>
			{error && <span className="text-xs text-danger-600 mt-1">{error}</span>}
		</div>
	);
};
