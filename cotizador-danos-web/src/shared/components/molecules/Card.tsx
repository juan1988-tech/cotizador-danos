import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const VARIANT_STYLES: Record<string, string> = {
  default: 'bg-white border border-slate-200',
  outlined: 'bg-transparent border-2 border-slate-300',
  elevated: 'bg-white shadow-lg border border-slate-100',
};

const PADDING_STYLES: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = ({
  title,
  subtitle,
  children,
  footer,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}: CardProps) => {
  return (
    <div
      className={`rounded-lg ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    >
      {(title || subtitle) && (
        <div className="border-b border-slate-200 px-4 py-3">
          {title && <h3 className="text-lg font-semibold text-slate-800">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className={PADDING_STYLES[padding]}>{children}</div>
      {footer && (
        <div className="border-t border-slate-200 px-4 py-3 bg-slate-50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
