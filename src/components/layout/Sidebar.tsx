import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaTachometerAlt, FaUsers, FaFileMedical, FaSignOutAlt, FaHospitalUser, FaPalette } from "react-icons/fa";
import { useAuth } from "@/auth/AuthContext";
import { useMemo } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: Props) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const sections = useMemo(
    () => [
      {
        title: "EPC Suite",
        items: [{ to: "/", icon: <FaTachometerAlt />, label: "Dashboard" }],
      },
      {
        title: "Pacientes",
        items: [
          { to: "/patients", icon: <FaUsers />, label: "Listado" },
          { to: "/patients/new", icon: <FaHospitalUser />, label: "Nuevo" },
        ],
      },
      {
        title: "Configuración",
        items: [{ to: "/settings/branding", icon: <FaPalette />, label: "Branding" }],
      },
      ...(user?.role === "admin"
        ? [
            {
              title: "Administración",
              items: [
                { to: "/admin/users", icon: <FaFileMedical />, label: "Usuarios" },
                
              ],
            },
          ]
        : []),
    ],
    [user]
  );

  return (
    <aside className={`sb ${open ? "sb--open" : ""}`}>
      <div className="sb__brand">EPC Suite</div>
      <nav className="sb__nav">
        {sections.map((sec) => (
          <div key={sec.title} className="sb__section">
            <div className="sb__section__title">{sec.title}</div>
            {sec.items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                onClick={onClose}
                className={({ isActive }) =>
                  "sb__item " + (isActive || pathname === it.to ? "sb__item--active" : "")
                }
              >
                <span className="sb__icon">{it.icon}</span>
                <span>{it.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sb__footer">
        <div className="sb__user">
          <div className="sb__user__role">{(user?.role || "viewer").toUpperCase()}</div>
          <div className="sb__user__name">{user?.username}</div>
        </div>
        <button
          className="sb__logout"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        >
          <FaSignOutAlt /> <span>Salir</span>
        </button>
      </div>
    </aside>
  );
}