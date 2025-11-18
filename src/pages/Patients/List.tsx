// frontend/src/pages/Patients/List.tsx
import { useEffect, useMemo, useState } from "react";
import api from "@/api/axios";
import { useAuth } from "@/auth/AuthContext";
import {
  FaBed,
  FaClock,
  FaCheckCircle,
  FaFileSignature,
  FaFilter,
  FaNotesMedical,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./patients-list.css";

type PacienteItem = {
  id: string;
  apellido: string;
  nombre: string;
  dni?: string | null;
  hce_numero?: string | null; // número de HCE / admisión
  sector?: string | null;
  habitacion?: string | null;
  cama?: string | null;
  obra_social?: string | null;
  nro_beneficiario?: string | null;
  estado?: "internacion" | "falta_epc" | "epc_generada" | "alta" | null;
};

type ListResponse = {
  items: PacienteItem[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
};

const ESTADOS = [
  { key: "internacion", label: "Internación" },
  { key: "falta_epc", label: "Falta EPC" },
  { key: "epc_generada", label: "EPC generada" },
  { key: "alta", label: "Alta" },
];

const PAGE_SIZE = 20;

// Debounce local
function useDebouncedValue<T>(value: T, delay = 450): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Formatea errores de axios / FastAPI en string
function formatError(e: any, fallback: string): string {
  const detail = e?.response?.data?.detail;

  if (Array.isArray(detail)) {
    const msgs = detail.map((d) => {
      if (typeof d === "string") return d;
      if (d?.msg) return d.msg;
      try {
        return JSON.stringify(d);
      } catch {
        return String(d);
      }
    });
    return msgs.join(" | ") || fallback;
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (detail && typeof detail === "object") {
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }

  if (e?.message) return e.message;

  return fallback;
}

export default function PatientsList() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<PacienteItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brainThinking, setBrainThinking] = useState(false);

  const estadoLabel = useMemo(() => {
    if (!estadoFilter) return "Todos";
    const found = ESTADOS.find((e) => e.key === estadoFilter);
    return found ? found.label : "Todos";
  }, [estadoFilter]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page,
        page_size: PAGE_SIZE,
      };
      if (estadoFilter) params.estado = estadoFilter;
      if (debouncedSearch.trim()) params.q = debouncedSearch.trim();

      const { data } = await api.get<ListResponse>("/patients", { params });
      setItems(data.items);
      setTotal(data.total);
      setHasNext(data.has_next);
      setHasPrev(data.has_prev);
    } catch (e: any) {
      setError(formatError(e, "Error al cargar pacientes"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, estadoFilter, debouncedSearch]);

  async function openEpc(p: PacienteItem, shouldGenerate: boolean) {
    try {
      setActionLoading(p.id);
      if (shouldGenerate) setBrainThinking(true);

      const opened = await api.post("/epc/open", {
        patient_id: p.id,
        admission_id: null,
      });
      const epcId: string = opened.data.id;

      if (shouldGenerate) {
        await api.post(`/epc/${epcId}/generate`);

        // 🔁 Refrescamos el estado local para que el botón pase a "Ver EPC"
        setItems((prev) =>
          prev.map((it) =>
            it.id === p.id ? { ...it, estado: "epc_generada" } : it
          )
        );
      }

      navigate(`/epc/${epcId}`);
    } catch (e: any) {
      setError(formatError(e, "No se pudo procesar la EPC"));
    } finally {
      setBrainThinking(false);
      setActionLoading(null);
    }
  }

  async function handleDelete(patientId: string) {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }
    try {
      setActionLoading(patientId);
      await api.delete(`/patients/${patientId}`);
      await fetchData();
    } catch (e: any) {
      setError(formatError(e, "No se pudo eliminar el paciente"));
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="patients-page">
      <div className="patients-page__header">
        <div>
          <h1>Pacientes</h1>
          <p className="subtitle">
            Gestión de pacientes internados, generación de EPC y estados de
            alta.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn--primary"
            onClick={() => navigate("/patients/new")}
          >
            Nuevo paciente
          </button>
          <button className="btn btn--ghost" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="patients-filters">
        <div className="filter-group">
          <FaFilter className="filter-icon" />
          <select
            value={estadoFilter || ""}
            onChange={(e) =>
              setEstadoFilter(e.target.value === "" ? null : e.target.value)
            }
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e.key} value={e.key}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div className="search-group">
          <input
            type="text"
            placeholder="Buscar (apellido, nombre, DNI, HCE, habitación, cama)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="patients-card">
        <div className="patients-card__header">
          <div className="badge">{estadoLabel}</div>
          <div className="count">
            {total} resultado(s) — Página {page}
          </div>
        </div>

        <div className="patients-table-wrapper">
          <table className="patients-table">
            <thead>
              <tr>
                <th>Apellido</th>
                <th>Nombre</th>
                <th>DNI</th>
                <th>N° HCE / Adm.</th>
                <th>Sector</th>
                <th>Hab.</th>
                <th>Cama</th>
                <th>Obra Social</th>
                <th>N° Benef.</th>
                <th>Estado</th>
                <th style={{ width: 260 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center" }}>
                    Cargando…
                  </td>
                </tr>
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center" }}>
                    No hay pacientes que coincidan con los filtros actuales.
                  </td>
                </tr>
              )}

              {!loading &&
                items.map((p) => {
                  const isGenerated = p.estado === "epc_generada";
                  return (
                    <tr key={p.id}>
                      <td>{p.apellido}</td>
                      <td>{p.nombre}</td>
                      <td>{p.dni || "-"}</td>
                      <td>{p.hce_numero || "-"}</td>
                      <td>{p.sector || "-"}</td>
                      <td>{p.habitacion || "-"}</td>
                      <td>{p.cama || "-"}</td>
                      <td>{p.obra_social || "-"}</td>
                      <td>{p.nro_beneficiario || "-"}</td>
                      <td>
                        {p.estado === "internacion" && (
                          <span className="badge badge--yellow">
                            <FaBed /> Internación
                          </span>
                        )}
                        {p.estado === "falta_epc" && (
                          <span className="badge badge--orange">
                            <FaClock /> Falta EPC
                          </span>
                        )}
                        {p.estado === "epc_generada" && (
                          <span className="badge badge--green">
                            <FaCheckCircle /> EPC generada
                          </span>
                        )}
                        {p.estado === "alta" && (
                          <span className="badge badge--blue">
                            <FaFileSignature /> Alta
                          </span>
                        )}
                        {!p.estado && (
                          <span className="badge">Sin estado</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition disabled:opacity-60"
                          onClick={() =>
                            openEpc(
                              p,
                              !(
                                p.estado === "epc_generada" ||
                                p.estado === "alta"
                              )
                            )
                          }
                          disabled={!!actionLoading}
                          title={isGenerated ? "Ver EPC" : "Generar EPC"}
                        >
                          {isGenerated ? (
                            <FaFileSignature />
                          ) : (
                            <FaNotesMedical />
                          )}
                          {actionLoading === p.id
                            ? "Procesando…"
                            : isGenerated
                            ? "Ver EPC"
                            : "Generar EPC"}
                        </button>
                        {user?.role === "admin" && (
                          <>
                            <button
                              className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 transition disabled:opacity-60"
                              onClick={() => navigate(`/patients/${p.id}/edit`)}
                              disabled={!!actionLoading}
                              title="Editar paciente"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 transition disabled:opacity-60"
                              onClick={() => handleDelete(p.id)}
                              disabled={!!actionLoading}
                              title="Eliminar paciente"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="patients-pagination">
          <button
            className="btn btn--ghost"
            disabled={!hasPrev || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </button>
          <button
            className="btn btn--ghost"
            disabled={!hasNext || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 text-red-400 bg-red-900/20 border border-red-700/40 rounded p-3">
          {error}
        </div>
      )}

      {brainThinking && (
        <div className="epc-thinking-overlay">
          <div className="epc-thinking-card">
            <div className="epc-brain">
              <div className="epc-brain-core" />
            </div>
            <div className="epc-thinking-text">
              Generando Epicrisis con IA…
            </div>
            <div className="epc-progress">
              <div className="epc-progress-bar" />
            </div>
            <div className="epc-thinking-sub">
              Analizando HCE, CIE-10 y contexto clínico…
            </div>
          </div>
        </div>
      )}
    </div>
  );
}