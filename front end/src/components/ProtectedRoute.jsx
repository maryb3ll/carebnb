import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Renders children only when the user is logged in and has the required role.
 * @param {Object} props
 * @param {React.ReactNode} props.children - The protected content
 * @param {string} props.requireRole - Required role: 'patient' or 'provider'
 */
export default function ProtectedRoute({ children, requireRole }) {
  const { user, loading, hasRole, currentRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center text-stone-500">
        Loading…
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If specific role is required, check if user has it
  if (requireRole) {
    console.log('ProtectedRoute - Required role:', requireRole, 'Has role:', hasRole(requireRole), 'Current role:', currentRole);
    if (!hasRole(requireRole)) {
      console.log('Access denied - user does not have required role:', requireRole);
      // User doesn't have the required role - redirect to their default page
      if (currentRole === 'patient') {
        return <Navigate to="/patient-search-and-booking" replace />;
      } else if (currentRole === 'provider') {
        return <Navigate to="/provider-dashboard-and-management" replace />;
      } else {
        // No role - shouldn't happen, but redirect to login
        return <Navigate to="/login" replace />;
      }
    }
  }

  return children;
}
