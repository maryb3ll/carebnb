import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import PatientSearchAndBooking from './pages/patient-search-and-booking';
import PatientSearchResults from './pages/patient-search-and-booking/PatientSearchResults';
import ProviderDashboardAndManagement from './pages/provider-dashboard-and-management';
import BookingsPage from "./pages/BookingsPage";
import RequestCarePage from "./pages/RequestCarePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        <Route path="/" element={<PatientSearchAndBooking />} />
        <Route path="/patient-search-and-booking" element={<PatientSearchAndBooking />} />
        <Route path="/patient-search-and-booking/results" element={<PatientSearchResults />} />
        <Route path="/provider-dashboard-and-management" element={<ProviderDashboardAndManagement />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/request-care" element={<RequestCarePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
