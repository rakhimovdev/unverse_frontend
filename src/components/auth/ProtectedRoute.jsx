import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AuthPageLoader from "./AuthPageLoader";

const ProtectedRoute = ({ roles = [] }) => {
    const { loading, isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <AuthPageLoader
                title="Checking your access"
                subtitle="Verifying your protected route permissions..."
            />
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/sign_in" replace state={{ from: location }} />;
    }

    if (roles.length > 0 && !roles.includes(user?.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
