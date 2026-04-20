import { Outlet } from 'react-router-dom';
import { Navbar } from '../shared/components/organisms/Navbar';

export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-center text-slate-400">
            &copy; {new Date().getFullYear()} Cotizador de Seguros de Daños
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
