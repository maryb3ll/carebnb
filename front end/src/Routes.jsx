import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import { useAuth } from './context/AuthContext';
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
import AIIntakePage from "./pages/AIIntakePage";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Root redirects to appropriate page based on role */}
        <Route path="/" element={<ProtectedRoute><RoleBasedRedirect /></ProtectedRoute>} />

        {/* Patient routes */}
        <Route path="/patient-search-and-booking" element={<ProtectedRoute requireRole="patient"><PatientSearchAndBooking /></ProtectedRoute>} />
        <Route path="/patient-search-and-booking/results" element={<ProtectedRoute requireRole="patient"><PatientSearchResults /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute requireRole="patient"><BookingsPage /></ProtectedRoute>} />
        <Route path="/request-care" element={<ProtectedRoute requireRole="patient"><RequestCarePage /></ProtectedRoute>} />
        <Route path="/ai-intake" element={<ProtectedRoute requireRole="patient"><AIIntakePage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute requireRole="patient"><PatientProfilePage /></ProtectedRoute>} />

        {/* Provider routes */}
        <Route path="/provider-dashboard-and-management" element={<ProtectedRoute requireRole="provider"><ProviderDashboardAndManagement /></ProtectedRoute>} />

        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

// Component to redirect to appropriate homepage based on user's role
const RoleBasedRedirect = () => {
  const { currentRole } = useAuth();

  if (currentRole === 'provider') {
    return <Navigate to="/provider-dashboard-and-management" replace />;
  } else if (currentRole === 'patient') {
    return <Navigate to="/patient-search-and-booking" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default Routes;
