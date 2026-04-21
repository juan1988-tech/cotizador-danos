import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  className,
  children,
  disabled,
  ...props 
}: ButtonProps) => {
  const baseStyles = 'font-medium rounded-lg transition-colors';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-950',
    danger: 'bg-danger-600 hover:bg-danger-700 text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const disabledOrLoading = disabled || loading;
  const buttonClass = [
    baseStyles,
    variants[variant],
    sizes[size],
    disabledOrLoading ? 'opacity-50 cursor-not-allowed' : '',
    className || ''
  ].join(' ').trim();

  return (
    <button
      className={buttonClass}
      disabled={disabledOrLoading}
      {...props}
    >
      {loading ? 'Cargando...' : children}
    </button>
  );
};