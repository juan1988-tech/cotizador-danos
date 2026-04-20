import type { ReactNode } from 'react';

interface AlertProps {
	type?: 'info' | 'success' | 'warning' | 'danger';
	children: ReactNode;
	className?: string;
}

const typeStyles: Record<string, string> = {
	info: 'bg-blue-50 border-blue-400 text-blue-800',
	success: 'bg-green-50 border-green-400 text-green-800',
	warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
	danger: 'bg-danger-50 border-danger-600 text-danger-800',
};

export const Alert = ({ type = 'info', children, className = '' }: AlertProps) => {
	return (
		<div
			className={`border-l-4 p-4 rounded-md ${typeStyles[type]} ${className}`}
			role="alert"
		>
			{children}
		</div>
	);
};
