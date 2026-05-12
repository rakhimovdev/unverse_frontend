import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { resolveDashboardPath } from "../../utils/authRoutes";
import AuthPageLoader from "./AuthPageLoader";

const PublicOnlyRoute = () => {
    const { loading, isAuthenticated, user } = useAuth();

    if (loading) {
        return (
            <AuthPageLoader
                title="Restoring your session"
                subtitle="Making sure we send you to the right dashboard..."
            />
        );
    }

    if (isAuthenticated) {
        return <Navigate to={resolveDashboardPath(user?.role)} replace />;
    }

    return <Outlet />;
};

export default PublicOnlyRoute;
