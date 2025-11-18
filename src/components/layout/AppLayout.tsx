import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import "./layout.css";

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => setSidebarOpen((prev) => !prev);
  const handleCloseSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-shell">
      {/* Header fijo arriba */}
      <Header onToggleSidebar={handleToggleSidebar} />

      {/* Sidebar (desktop + móvil off-canvas) */}
      <Sidebar open={sidebarOpen} onClose={handleCloseSidebar} />

      {/* Scrim móvil */}
      {sidebarOpen && <div className="scrim" onClick={handleCloseSidebar} />}

      {/* Contenido principal */}
      <main className="app-main">
        <div className="content-container">
          {/* Aquí se inyectan las páginas (Pacientes, EPC, etc.) */}
          <Outlet />

          {/* Footer pegado abajo del contenedor */}
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;