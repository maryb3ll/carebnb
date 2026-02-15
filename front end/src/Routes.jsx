import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";
import PatientOnlyRoute from "components/PatientOnlyRoute";
import ProviderOnlyRoute from "components/ProviderOnlyRoute";
import NotFound from "pages/NotFound";
import PatientSearchAndBooking from './pages/patient-search-and-booking';
import PatientSearchResults from './pages/patient-search-and-booking/PatientSearchResults';
import ProviderDashboardAndManagement from './pages/provider-dashboard-and-management';
import BookingsPage from "./pages/BookingsPage";
import RequestCarePage from "./pages/RequestCarePage";
import PatientProfilePage from "./pages/PatientProfilePage";
import LoginPage from "./pages/LoginPage";
import ProviderLoginPage from "./pages/ProviderLoginPage";
import SignupPage from "./pages/SignupPage";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        <Route path="/" element={<ProtectedRoute><PatientOnlyRoute><PatientSearchAndBooking /></PatientOnlyRoute></ProtectedRoute>} />
        <Route path="/patient-search-and-booking" element={<ProtectedRoute><PatientOnlyRoute><PatientSearchAndBooking /></PatientOnlyRoute></ProtectedRoute>} />
        <Route path="/patient-search-and-booking/results" element={<ProtectedRoute><PatientOnlyRoute><PatientSearchResults /></PatientOnlyRoute></ProtectedRoute>} />
        <Route path="/provider-dashboard-and-management" element={<ProviderOnlyRoute><ProviderDashboardAndManagement /></ProviderOnlyRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><PatientOnlyRoute><BookingsPage /></PatientOnlyRoute></ProtectedRoute>} />
        <Route path="/request-care" element={<ProtectedRoute><PatientOnlyRoute><RequestCarePage /></PatientOnlyRoute></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PatientOnlyRoute><PatientProfilePage /></PatientOnlyRoute></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/provider" element={<ProviderLoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
