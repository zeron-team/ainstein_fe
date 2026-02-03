// src/api/axios.ts
import axios, { AxiosError, AxiosHeaders } from "axios";

// ==============================
// Base URL (dev vs producción)
// ==============================
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "/api");

// ==============================
// Helpers auth token
// ==============================
function getAuthTokenFromStorage(): string | null {
  const candidates = [
    "access_token",
    "accessToken",
    "token",
    "jwt",
    "id_token",
    "auth_token",
    "AUTH_TOKEN",
    "ACCESS_TOKEN",
  ];

  for (const k of candidates) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }
  for (const k of candidates) {
    const v = sessionStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }

  // fallback: objetos tipo {access_token:"..."} o {token:"..."}
  const objCandidates = ["auth", "session", "user", "tokens"];
  for (const k of objCandidates) {
    const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const v =
        parsed?.access_token ||
        parsed?.accessToken ||
        parsed?.token ||
        parsed?.jwt ||
        parsed?.id_token ||
        parsed?.auth_token;
      if (typeof v === "string" && v.trim()) return v.trim();
    } catch {
      // ignore
    }
  }

  return null;
}

function toBearer(token: string | null): string | null {
  if (!token) return null;
  const t = token.trim();
  if (!t) return null;
  if (t.toLowerCase().startsWith("bearer ")) return t;
  return `Bearer ${t}`;
}

function setAuthHeader(config: any, bearer: string) {
  // Axios v1: config.headers suele ser AxiosHeaders con .set()
  if (config.headers && typeof (config.headers as any).set === "function") {
    (config.headers as AxiosHeaders).set("Authorization", bearer);
    return;
  }

  // Si no existe, creamos objeto plano
  const headers = (config.headers || {}) as any;

  // No pisar si ya viene definido
  if (!headers.Authorization && !headers.authorization) {
    headers.Authorization = bearer;
  }

  config.headers = headers;
}

// ==============================
// Axios instance
// ==============================
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: agrega Authorization SIEMPRE que haya token
api.interceptors.request.use(
  (config) => {
    const token = getAuthTokenFromStorage();
    const bearer = toBearer(token);

    if (bearer) {
      setAuthHeader(config, bearer);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: devuelve error limpio
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => Promise.reject(error)
);

export default api;

// Export helpers por si querés debug
export { getAuthTokenFromStorage, toBearer };

// ==============================
// AInstein WS (via backend proxy)
// ==============================

export type AinsteinMovimiento = {
  inmoCodigo: number;
  inmoFechaDesde: string;
  salaDescripcion?: string;
  nicuDescripcion?: string;
};

export type AinsteinEpisodio = {
  inteCodigo: number;
  paciCodigo: number;
  paciEdad?: number;
  paciSexo?: string;
  inteFechaIngreso?: string;
  inteFechaEgreso?: string;
  inteDiasEstada?: number;
  taltDescripcion?: string;
  movimientos?: AinsteinMovimiento[];
};

export type AinsteinDiagnostico = { diagDescripcion?: string };

export type AinsteinPlantillaProp = {
  engpCodigo?: number;
  grprDescripcion?: string;
  engpValor?: unknown;
  opciones?: { grpoDescripcion?: string }[];
};

export type AinsteinPlantillaGrupo = {
  grupDescripcion?: string;
  propiedades?: AinsteinPlantillaProp[];
};

export type AinsteinIndicacionFarm = {
  enmeCodigo?: number;
  geneDescripcion?: string;
  enmeDosis?: string;
  tumeDescripcion?: string;
  mefrDescripcion?: string;
  meviDescripcion?: string;
  aplicaciones?: { panoFechaAtencion?: string; nomeDescripcion?: string }[];
};

export type AinsteinIndicacionProc = {
  enprCodigo?: number;
  procDescripcion?: string;
  enprObservacion?: string | null;
};

export type AinsteinIndicacionEnf = {
  eninCodigo?: number;
  indiDescripcion?: string;
  eninObservacion?: string | null;
};

export type AinsteinHistoriaEntrada = {
  entrCodigo: number;
  entrFechaAtencion?: string;
  entrTipoRegistro?: string;
  entrMotivoConsulta?: string | null;
  entrEvolucion?: string | null;
  entrPlan?: string | null;
  indicacionFarmacologica?: AinsteinIndicacionFarm[] | null;
  indicacionProcedimientos?: AinsteinIndicacionProc[] | null;
  indicacionEnfermeria?: AinsteinIndicacionEnf[] | null;
  diagnosticos?: AinsteinDiagnostico[] | null;
  plantillas?: AinsteinPlantillaGrupo[] | null;
};

function extractAxiosErrorMessage(e: unknown): string {
  const err = e as AxiosError<any>;
  const status = err?.response?.status;
  const data = err?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }
  if (data && typeof data === "object") {
    const msg =
      (data as any)?.detail ||
      (data as any)?.message ||
      (data as any)?.error ||
      (data as any)?.msg;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  if (status) return `Error HTTP ${status}`;
  return (err as any)?.message || "Error de red";
}

export async function fetchAinsteinEpisodios(
  desde: string,
  hasta: string,
  tenant: string = "markey"  // Default to markey for backwards compatibility
): Promise<AinsteinEpisodio[]> {
  try {
    const res = await api.get("/ainstein/episodios", {
      params: { tenant, desde, hasta },
    });
    const data = res?.data;
    return Array.isArray(data) ? (data as AinsteinEpisodio[]) : [];
  } catch (e) {
    throw new Error(extractAxiosErrorMessage(e));
  }
}

export async function fetchAinsteinHistoria(
  inteCodigo: number,
  paciCodigo: number,
  tenant: string = "markey"  // Default to markey for backwards compatibility
): Promise<AinsteinHistoriaEntrada[]> {
  try {
    const res = await api.get("/ainstein/historia", {
      params: { tenant, inteCodigo, paciCodigo },
    });
    const data = res?.data;
    return Array.isArray(data) ? (data as AinsteinHistoriaEntrada[]) : [];
  } catch (e) {
    throw new Error(extractAxiosErrorMessage(e));
  }
}