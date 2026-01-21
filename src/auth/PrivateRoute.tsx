// src/auth/PrivateRoute.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

type Props = { roles?: Array<"admin" | "medico" | "viewer"> };

const PrivateRoute: React.FC<Props> = ({ roles }) => {
  const location = useLocation();
  const { token, user, loading } = useAuth();

  // 👉 clave: NO decidir mientras rehidratás el token
  if (loading) return null;

  // Si no hay token, mandamos a login y guardamos la ruta original
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si token existe pero user todavía no (por cualquier causa), no rompas navegación
  if (!user) return null;

  // Control de roles
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;