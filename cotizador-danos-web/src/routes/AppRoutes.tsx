import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QuoteLayout } from '../layouts/QuoteLayout';
import { QuoteListPage } from '../features/quotes/pages/QuoteListPage';
import { GeneralInfoPage } from '../features/quotes/pages/GeneralInfoPage';
import { LocationsPage } from '../features/locations/pages/LocationsPage';
import { TechnicalInfoPage } from '../features/quotes/pages/TechnicalInfoPage';
import { TermsPage } from '../features/quotes/pages/TermsPage';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/cotizador" replace />} />
        <Route path="/cotizador" element={<QuoteListPage />} />
        
        <Route path="/quotes/:folio" element={<QuoteLayout />}>
          <Route index element={<Navigate to="general-info" replace />} />
          <Route path="general-info" element={<GeneralInfoPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="technical-info" element={<TechnicalInfoPage />} />
          <Route path="terms-and-conditions" element={<TermsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};