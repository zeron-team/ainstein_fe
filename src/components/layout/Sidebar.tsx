// src/components/layout/Sidebar.tsx

import React, { useEffect, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaFileMedical,
  FaHospitalUser,
  FaCloudDownloadAlt,
  FaChartBar,
  FaHeartbeat,
  FaDollarSign,
  FaBuilding,
  FaHome,
  FaClipboardList,
  FaStethoscope,
  FaLightbulb,
} from "react-icons/fa";
import { useAuth } from "@/auth/AuthContext";

const SIDEBAR_BUILD_ID = "2026-02-27_backoffice_split";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: Props) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    console.log("[Sidebar] build:", SIDEBAR_BUILD_ID);
  }, []);

  const sections = useMemo(
    () => [
      {
        title: "EPC Suite",
        items: [
          { to: "/", icon: <FaHome />, label: "Inicio" },
          { to: "/dashboard", icon: <FaTachometerAlt />, label: "Dashboard" },
          { to: "/patients", icon: <FaUsers />, label: "Pacientes" },
          { to: "/patients/new", icon: <FaHospitalUser />, label: "Nuevo Paciente" },
          { to: "/ainstein", icon: <FaCloudDownloadAlt />, label: "WS HCE" },
        ],
      },
      ...(user?.role === "admin"
        ? [
          {
            title: "Back-office",
            items: [
              {
                to: "/admin/feedback",
                icon: <FaChartBar />,
                label: "Feedback",
              },
              {
                to: "/admin/epc-control",
                icon: <FaClipboardList />,
                label: "Control EPC",
              },
              {
                to: "/admin/costs",
                icon: <FaDollarSign />,
                label: "Costos IA",
              },
              {
                to: "/admin/golden-rules",
                icon: <FaLightbulb />,
                label: "Golden Rules",
              },
            ],
          },
          {
            title: "Administración",
            items: [
              {
                to: "/admin/users",
                icon: <FaFileMedical />,
                label: "Usuarios",
              },
              {
                to: "/admin/tenants",
                icon: <FaBuilding />,
                label: "Tenants",
              },
              {
                to: "/admin/health",
                icon: <FaHeartbeat />,
                label: "Estado Sistema",
              },
            ],
          },
          {
            title: "Integraciones",
            items: [
              {
                to: "/admin/snomed",
                icon: <FaStethoscope />,
                label: "SNOMED CT",
              },
            ],
          },
        ]
        : []),
    ],
    [user]
  );

  return (
    <aside className={`sb ${open ? "sb--open" : ""}`} data-build-id={SIDEBAR_BUILD_ID}>
      <div className="sb__brand" title={`Sidebar build: ${SIDEBAR_BUILD_ID}`}>
        EPC Builder
      </div>

      <nav className="sb__nav">
        {sections.map((sec) => (
          <div key={sec.title} className="sb__section">
            <div className="sb__section__title">{sec.title}</div>

            {sec.items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === "/"}
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
    </aside>
  );
}