import { FaBars, FaBell, FaSearch, FaSun, FaUserCircle } from "react-icons/fa";
import { useAuth } from "@/auth/AuthContext";

type HeaderProps = {
  onToggleSidebar: () => void;
};

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  const displayName =
    user?.username || user?.email || user?.fullName || "Profesional";
  const roleLabel =
    user?.role === "admin"
      ? "Administrador"
      : user?.role === "gestor"
      ? "Gestor"
      : "Equipo de salud";

  return (
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
        <div className="brand__logo">EC</div>
        <div>
          <div className="brand__title">ZRN · Epicrisis</div>
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
          // hook rápido: alternar data-theme en <html>
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

      {/* Usuario logueado */}
      <div className="user-pill">
        <FaUserCircle size={22} />
        <div className="user-pill__meta">
          <span className="user-pill__name">{displayName}</span>
          <span className="user-pill__role">{roleLabel}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;