// src/router.tsx
import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import AppLayout from "@/components/layout/AppLayout";

import PrivateRoute from "@/auth/PrivateRoute";
import PublicRoute from "@/auth/PublicRoute";

import Login from "@/pages/Login";
import Welcome from "@/pages/Welcome";
import Dashboard from "@/pages/Dashboard";
import PatientsList from "@/pages/Patients/List";
import PatientForm from "@/pages/Patients/Form";
import EPCViewEdit from "@/pages/EPC/ViewEdit";
import Branding from "@/pages/Settings/Branding";
import UsersCRUD from "@/pages/Users/UsersCRUD";
import FeedbackDashboard from "@/pages/Admin/FeedbackDashboard";
import CostsDashboard from "@/pages/Admin/CostsDashboard";
import HealthCheck from "@/pages/Admin/HealthCheck";
import TenantManager from "@/pages/Admin/TenantManager";
import EPCControlDashboard from "@/pages/Admin/EPCControlDashboard";
import SnomedDashboard from "@/pages/Admin/SnomedDashboard";
import GoldenRules from "@/pages/Admin/GoldenRules";
import ErrorPage from "@/pages/ErrorPage";
import AinsteinWsPage from "@/pages/AinsteinWsPage";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <PublicRoute redirectTo="/" />,
    errorElement: <ErrorPage />,
    children: [{ index: true, element: <Login /> }],
  },
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <PrivateRoute />, // ✅ todo lo de adentro requiere token
        children: [
          { index: true, element: <Welcome /> },
          { path: "dashboard", element: <Dashboard /> },

          { path: "patients", element: <PatientsList /> },
          { path: "patients/new", element: <PatientForm /> },
          { path: "patients/:id/edit", element: <PatientForm /> },

          { path: "epc/:id", element: <EPCViewEdit /> },

          // ✅ Webservice Ainstein
          { path: "ainstein", element: <AinsteinWsPage /> },

          { path: "settings/branding", element: <Branding /> },

          // ✅ Admin-only
          {
            element: <PrivateRoute roles={["admin"]} />,
            children: [
              { path: "admin/users", element: <UsersCRUD /> },
              { path: "admin/patients", element: <PatientsList /> },
              { path: "admin/feedback", element: <FeedbackDashboard /> },
              { path: "admin/costs", element: <CostsDashboard /> },
              { path: "admin/health", element: <HealthCheck /> },
              { path: "admin/tenants", element: <TenantManager /> },
              { path: "admin/epc-control", element: <EPCControlDashboard /> },
              { path: "admin/snomed", element: <SnomedDashboard /> },
              { path: "admin/golden-rules", element: <GoldenRules /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
    errorElement: <ErrorPage />,
  },
]);

export default router;