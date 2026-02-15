import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import PatientSearchAndBooking from './pages/patient-search-and-booking';
import ProviderDashboardAndManagement from './pages/provider-dashboard-and-management';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<PatientSearchAndBooking />} />
        <Route path="/patient-search-and-booking" element={<PatientSearchAndBooking />} />
        <Route path="/provider-dashboard-and-management" element={<ProviderDashboardAndManagement />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
