import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";
import NotFound from "pages/NotFound";
import PatientSearchAndBooking from './pages/patient-search-and-booking';
import PatientSearchResults from './pages/patient-search-and-booking/PatientSearchResults';
import ProviderDashboardAndManagement from './pages/provider-dashboard-and-management';
import BookingsPage from "./pages/BookingsPage";
import RequestCarePage from "./pages/RequestCarePage";
import PatientProfilePage from "./pages/PatientProfilePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        <Route path="/" element={<ProtectedRoute><PatientSearchAndBooking /></ProtectedRoute>} />
        <Route path="/patient-search-and-booking" element={<ProtectedRoute><PatientSearchAndBooking /></ProtectedRoute>} />
        <Route path="/patient-search-and-booking/results" element={<ProtectedRoute><PatientSearchResults /></ProtectedRoute>} />
        <Route path="/provider-dashboard-and-management" element={<ProviderDashboardAndManagement />} />
        <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
        <Route path="/request-care" element={<ProtectedRoute><RequestCarePage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PatientProfilePage /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
