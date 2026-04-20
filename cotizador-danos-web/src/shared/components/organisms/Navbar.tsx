import { Link } from 'react-router-dom';

interface NavbarProps {
  className?: string;
}

export const Navbar = ({ className = '' }: NavbarProps) => {
  return (
    <nav className={`bg-white border-b border-slate-200 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <div>
                <p className="text-sm font-bold text-slate-800">Cotizador de Daños</p>
                <p className="text-xs text-slate-500">Seguros de Daños</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/cotizador"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cotizaciones
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
