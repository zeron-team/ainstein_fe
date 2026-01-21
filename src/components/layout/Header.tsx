// frontend/src/components/layout/Header.tsx

import { useState } from "react";
import {
  FaBars,
  FaBell,
  FaSearch,
  FaSun,
  FaUserCircle,
  FaSignOutAlt,
  FaQuestionCircle,
} from "react-icons/fa";
import { useAuth } from "@/auth/AuthContext";
import HelpModal from "@/components/HelpModal";

type HeaderProps = {
  onToggleSidebar: () => void;
};

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showHelp, setShowHelp] = useState(false);

  // Nos ajustamos al modelo de User real: username + role ("admin" | "medico" | "viewer")
  const displayName = user?.username ?? "Profesional";

  const roleLabel =
    user?.role === "admin"
      ? "Administrador"
      : user?.role === "medico"
        ? "Médico"
        : user?.role === "viewer"
          ? "Viewer"
          : "Equipo de salud";

  return (
    <>
      <header className="app-header">
        {/* Botón hamburguesa solo en mobile (clase .show-mobile la controla el CSS) */}
        <button
          type="button"
          className="icon-btn show-mobile"
          onClick={onToggleSidebar}
          aria-label="Abrir menú"
        >
          <FaBars size={15} />
        </button>

        {/* Marca / producto */}
        <div className="brand">
          <div className="brand__logo">EPC</div>
          <div>
            <div className="brand__title">EPC Builder</div>
            <div className="brand__subtitle">
              Epicrisis clínica asistida por IA
            </div>
          </div>
        </div>

        {/* Buscador global (solo visual por ahora) */}
        <div className="header-search">
          <FaSearch size={13} />
          <input
            type="search"
            placeholder="Buscar paciente, EPC o HCE…"
            aria-label="Buscar"
          />
        </div>

        <div className="spacer" />

        {/* Acciones rápidas del header */}

        {/* ✅ Botón de Ayuda - al lado de la campana */}
        <button
          type="button"
          className="icon-btn"
          aria-label="Ayuda del sistema"
          title="Ayuda"
          onClick={() => setShowHelp(true)}
        >
          <FaQuestionCircle size={14} />
        </button>

        <button
          type="button"
          className="icon-btn"
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <FaBell size={14} />
        </button>

        {/* Futuro: toggle de tema claro/oscuro */}
        <button
          type="button"
          className="icon-btn"
          aria-label="Cambiar tema"
          title="Tema"
          onClick={() => {
            const root = document.documentElement;
            const current = root.getAttribute("data-theme") || "dark";
            root.setAttribute(
              "data-theme",
              current === "dark" ? "light" : "dark"
            );
          }}
        >
          <FaSun size={14} />
        </button>

        {/* Usuario logueado + logout */}
        <div className="user-pill">
          <FaUserCircle size={22} />
          <div className="user-pill__meta">
            <span className="user-pill__name">{displayName}</span>
            <span className="user-pill__role">{roleLabel}</span>
          </div>
          <button
            type="button"
            className="icon-btn user-pill__logout"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            onClick={logout}
          >
            <FaSignOutAlt size={14} />
          </button>
        </div>
      </header>

      {/* Modal de ayuda */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
};

export default Header;