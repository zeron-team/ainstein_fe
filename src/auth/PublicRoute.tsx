// src/auth/PublicRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

type Props = {
    redirectTo?: string; // a dónde mandar si ya está logueado
};

const PublicRoute: React.FC<Props> = ({ redirectTo = "/" }) => {
    const { token, loading } = useAuth();

    // mientras rehidrata, no decidas
    if (loading) return null;

    // si ya está logueado, no mostrar /login
    if (token) return <Navigate to={redirectTo} replace />;

    return <Outlet />;
};

export default PublicRoute;