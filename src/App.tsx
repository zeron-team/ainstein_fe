// src/App.tsx
import React from "react";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import router from "./router";

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;