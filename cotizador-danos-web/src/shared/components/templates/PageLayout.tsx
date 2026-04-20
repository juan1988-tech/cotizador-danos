import type { ReactNode } from 'react';

interface PageLayoutProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const MAX_WIDTH_STYLES: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
};

export const PageLayout = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
  maxWidth = '2xl',
}: PageLayoutProps) => {
  return (
    <div className={`w-full mx-auto ${MAX_WIDTH_STYLES[maxWidth]} ${className}`}>
      {(title || actions) && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default PageLayout;
