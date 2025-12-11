// src/components/ProtectedRoute.tsx

import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import the hook

// Simple full-page loading spinner component
const FullPageSpinner = () => (
    <div className="flex justify-center items-center h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading...</p>
    </div>
);

// Component to wrap routes that should only be accessible to logged-in users.
// Accepts an optional `requiredRole` prop which restricts access to users
// whose `user.role` (from AuthContext) matches the requiredRole.
interface ProtectedRouteProps {
    children: React.ReactElement;
    requiredRole?: string; // e.g. 'admin'
}

const Forbidden: React.FC<{ message?: string }> = ({ message }) => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border rounded-lg p-8 max-w-md w-full text-center">
            <h1 className="text-2xl font-semibold text-rose-600">403 — Forbidden</h1>
            <p className="mt-4 text-gray-600">{message || 'You do not have permission to view this page.'}</p>
            <div className="mt-6 flex justify-center gap-3">
                <Link to="/" className="px-4 py-2 bg-gray-100 rounded">Go to homepage</Link>
                <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded">Sign in as a different user</Link>
            </div>
        </div>
    </div>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
    // Get the current authentication status and loading state from our context.
    const { token, user, isLoading } = useAuth();
    const location = useLocation(); // Gets the current URL path

    // While the AuthContext is performing the initial check for a token
    // (e.g., on page load or after login/logout), show a loading indicator.
    if (isLoading) {
        return <FullPageSpinner />;
    }

    // If loading is finished and there's NO token, the user is not authenticated.
    if (!token) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // If a role is required, ensure user object exists and has the role
    if (requiredRole) {
        if (!user) {
            // No user data available even though token exists; treat as unauthenticated
            return <Navigate to="/login" replace state={{ from: location }} />;
        }

        const userRole = String((user as any).role || '').toLowerCase();
        const required = String(requiredRole).toLowerCase();

        if (userRole !== required) {
            // Authenticated but not authorized
            return <Forbidden />;
        }
    }

    // Authenticated (and authorized, if a role was required): render children
    return children;
};

export default ProtectedRoute;