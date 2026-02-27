// src/pages/Patients/List.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/api/axios";
import { useAuth } from "@/auth/AuthContext";
import {
  FaPlus,
  FaBed,
  FaClock,
  FaCheckCircle,
  FaFileSignature,
  FaFilter,
  FaNotesMedical,
  FaEdit,
  FaTrash,
  FaEye,
  FaTimes,
  FaChevronDown,
  FaChevronRight,
  FaRegListAlt,
  FaUser,
  FaVenusMars,
  FaHospitalAlt,
  FaClipboardList,
  FaSyringe,
  FaProcedures,
  FaUserNurse,
  FaStethoscope,
  FaSortAlphaDown,
  FaSortAlphaUpAlt,
  FaChevronLeft,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./patients-list.css";
import { ImportHceModal } from "@/components/ImportHceModal";


type PacienteItem = {
  id: string;
  apellido: string;
  nombre: string;
  dni?: string | null;
  hce_numero?: string | null; // número de HCE / admisión
  movimiento_id?: string | null; // ID Movimiento
  sector?: string | null;
  habitacion?: string | null;
  cama?: string | null;
  obra_social?: string | null;
  nro_beneficiario?: string | null;
  estado?: "internacion" | "falta_epc" | "epc_generada" | "alta" | null;
  fecha_ingreso?: string | null;
  fecha_egreso?: string | null;
  edad?: number | null;
  sexo?: string | null;
  dias_estada?: number | null;
  tipo_alta?: string | null;
  epc_created_by_name?: string | null; // usuario que generó la EPC
  epc_created_at?: string | null; // timestamp de creación de la EPC
};

type ListResponse = {
  items: PacienteItem[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
};

type AinsteinDiagnostico = {
  diagDescripcion?: string | null;
};

type AinsteinIndicacionFarmacologicaAplicacion = {
  panoFechaAtencion?: string | null;
  nomeDescripcion?: string | null;
};

type AinsteinMedicacionAsociada = {
  enmeCodigo?: number | null;
  geneDescripcion?: string | null;
  enmeDosis?: any;
  tumeDescripcion?: string | null;
};

type AinsteinIndicacionFarmacologica = {
  enmeCodigo?: number | null;
  geneDescripcion?: string | null;
  enmeVelocidad?: any;
  enmeDosis?: any;
  tumeDescripcion?: string | null;
  mefrDescripcion?: string | null;
  meviDescripcion?: string | null;
  meesDescripcion?: string | null;
  meprDescripcion?: string | null;
  medicacionAsociada?: AinsteinMedicacionAsociada[] | null;
  aplicaciones?: AinsteinIndicacionFarmacologicaAplicacion[] | null;
};

type AinsteinIndicacionProcedimiento = {
  enprCodigo?: number | null;
  procDescripcion?: string | null;
  enprObservacion?: string | null;
};

type AinsteinIndicacionEnfermeria = {
  eninCodigo?: number | null;
  indiDescripcion?: string | null;
  eninObservacion?: string | null;
};

type AinsteinPlantillaOpcion = {
  grpoDescripcion?: string | null;
};

type AinsteinPlantillaPropiedad = {
  engpCodigo?: number | null;
  grprDescripcion?: string | null;
  engpValor?: any;
  opciones?: AinsteinPlantillaOpcion[] | null;
};

type AinsteinPlantilla = {
  grupDescripcion?: string | null;
  propiedades?: AinsteinPlantillaPropiedad[] | null;
};

type AinsteinHistoriaEntrada = {
  entrCodigo: number;
  entrTipoRegistro?: string | null;
  entrFechaAtencion?: string | null;
  entrMotivoConsulta?: any;
  entrEvolucion?: any;
  entrPlan?: any;
  diagnosticos?: AinsteinDiagnostico[] | null;
  indicacionFarmacologica?: AinsteinIndicacionFarmacologica[] | null;
  indicacionProcedimientos?: AinsteinIndicacionProcedimiento[] | null;
  indicacionEnfermeria?: AinsteinIndicacionEnfermeria[] | null;
  plantillas?: AinsteinPlantilla[] | null;
};

type AinsteinMovimiento = {
  inmoCodigo?: number | null;
  inmoFechaDesde?: string | null;
  salaDescripcion?: string | null;
  nicuDescripcion?: string | null;
};

type AinsteinEpisodio = {
  inteCodigo?: number | null;
  paciCodigo?: number | null;
  paciEdad?: number | null;
  paciSexo?: string | null;
  inteFechaIngreso?: string | null;
  inteFechaEgreso?: string | null;
  inteDiasEstada?: number | null;
  taltDescripcion?: string | null;
  movimientos?: AinsteinMovimiento[] | null;
};

type HceDoc = {
  _id: string;
  patient_id: string;
  admission_id?: string | null;
  text?: string | null;
  pages?: number | null;
  structured?: Record<string, any> | null;
  ai_generated?: Record<string, any> | null;
  source?: Record<string, any> | null;
  ainstein?: {
    episodio?: AinsteinEpisodio | Record<string, any> | null;
    historia?: AinsteinHistoriaEntrada[] | any;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const ESTADOS = [
  { key: "internacion", label: "Internación" },
  { key: "falta_epc", label: "Falta EPC" },
  { key: "epc_generada", label: "EPC generada" },
  { key: "alta", label: "Alta" },
];

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

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

function safeText(v: any): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function stripHtml(v: any): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : safeText(v);
  return s.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

function fmtDt(v?: string | null): string {
  if (!v) return "-";
  return String(v)
    .replace("T", " ")
    .replace("Z", "")
    .replace(/\.\d+/, "")
    .trim();
}

function fmtDose(dose: any, unit?: string | null): string {
  const d = dose === null || dose === undefined ? "" : String(dose).trim();
  const u = unit ? String(unit).trim() : "";
  const x = [d, u].filter(Boolean).join(" ");
  return x || "-";
}

function toArray<T>(v: any): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function normalizeKey(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toMsFromAnyDateLike(v?: string | null): number {
  if (!v) return 0;
  const raw = String(v).trim();
  // Intento directo
  let t = new Date(raw).getTime();
  if (!Number.isNaN(t)) return t;

  // Intento "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
  const isoish = raw.includes(" ") && !raw.includes("T") ? raw.replace(" ", "T") : raw;
  t = new Date(isoish).getTime();
  if (!Number.isNaN(t)) return t;

  // Si el fmtDt ya devolvió "-" o algo no parseable
  return 0;
}

function isJsonishText(s?: string | null): boolean {
  if (!s) return false;
  const t = String(s).trim();
  if (!t) return false;
  if (!(t.startsWith("{") || t.startsWith("["))) return false;

  try {
    const parsed = JSON.parse(t);
    // Si es un objeto corto/metadata (ej: source/inteCodigo/paciCodigo), lo tratamos como "no texto clínico"
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const keys = Object.keys(parsed);
      const normKeys = keys.map((k) => normalizeKey(k));
      const looksLikeMeta =
        normKeys.includes("source") ||
        normKeys.includes("intecodigo") ||
        normKeys.includes("pacicodigo") ||
        normKeys.includes("patient_id") ||
        normKeys.includes("admission_id");
      return looksLikeMeta;
    }
    return true;
  } catch {
    return false;
  }
}

type Hito = {
  section: string;
  whenStr: string;
  whenMs: number;
  title: string;
  lines: string[];
};

function pushIfAny(hitos: Hito[], h: Hito) {
  const clean = (h.lines || []).map((x) => (x || "").trim()).filter(Boolean);
  if (!clean.length) return;
  hitos.push({ ...h, lines: clean });
}

function buildGroupedClinicalText(args: {
  doc: HceDoc | null;
  patient: PacienteItem | null;
  structuredSummary: any;
  episodio: AinsteinEpisodio | null;
  ubicacion: { label: string; when: string };
}): string {
  const { doc, patient, structuredSummary, episodio, ubicacion } = args;
  if (!doc) return "(Sin texto)";

  const out: string[] = [];

  const patientLine = patient ? `${patient.apellido} ${patient.nombre} • ID ${patient.id}` : "Paciente -";
  out.push(`HCE — TEXTO CONSOLIDADO POR SECCIONES`);
  out.push(patientLine);
  out.push("");

  // Cabecera (ingreso/ubicación)
  const ingreso = structuredSummary?.fecha_ingreso || "-";
  const egreso = structuredSummary?.fecha_egreso_original || "-";
  const adm = structuredSummary?.admision_num || "-";
  const prot = structuredSummary?.protocolo || "-";

  out.push(`Ingreso: ${ingreso}`);
  out.push(`Egreso (orig): ${egreso}`);
  out.push(`Ubicación: ${ubicacion?.label || "-"} (desde ${ubicacion?.when || "-"})`);
  out.push(`Adm/Protocolo: ${adm} • ${prot}`);
  out.push("");

  const hist = toArray<AinsteinHistoriaEntrada>(doc.ainstein?.historia);

  // Si NO hay Ainstein historia, caemos al texto crudo (si existe)
  if (!hist.length) {
    const raw = doc.text ? String(doc.text) : "";
    if (!raw) return out.concat(["(Sin historia Ainstein y sin texto)"]).join("\n");
    return out.concat(["TEXTO ORIGINAL", "----------------", raw]).join("\n");
  }

  const hitos: Hito[] = [];

  // Sección "Ingreso de paciente" (episodio + resumen)
  const ingresoMs = toMsFromAnyDateLike(structuredSummary?.fecha_ingreso_raw || structuredSummary?.fecha_ingreso);
  pushIfAny(hitos, {
    section: "Ingreso de paciente",
    whenStr:
      ingreso && ingreso !== "-"
        ? String(ingreso)
        : (episodio?.inteFechaIngreso ? fmtDt(episodio.inteFechaIngreso) : "-"),
    whenMs: ingresoMs || toMsFromAnyDateLike(episodio?.inteFechaIngreso),
    title: "Ingreso / admisión",
    lines: [
      `Fecha ingreso: ${ingreso && ingreso !== "-" ? ingreso : (episodio?.inteFechaIngreso ? fmtDt(episodio.inteFechaIngreso) : "-")}`,
      `Edad: ${structuredSummary?.edad ?? episodio?.paciEdad ?? "-"} • Sexo: ${structuredSummary?.sexo ?? episodio?.paciSexo ?? "-"}`,
      `Días estada: ${structuredSummary?.dias_estada ?? episodio?.inteDiasEstada ?? "-"}`,
      `Tipo alta: ${structuredSummary?.tipo_alta ?? episodio?.taltDescripcion ?? "-"}`,
    ],
  });

  // Recorremos historia y armamos hitos por SECCIÓN (no solo por "entrTipoRegistro")
  hist.forEach((h) => {
    const whenStr = h.entrFechaAtencion ? fmtDt(h.entrFechaAtencion) : "-";
    const whenMs = toMsFromAnyDateLike(h.entrFechaAtencion) || toMsFromAnyDateLike(whenStr);
    const tipo = (h.entrTipoRegistro || "Registro").trim();
    const baseTitle = `${tipo} #${h.entrCodigo}`;

    // Evolución / Motivo / Plan -> Evolución médica
    const motivo = stripHtml(h.entrMotivoConsulta);
    const evo = stripHtml(h.entrEvolucion);
    const plan = stripHtml(h.entrPlan);

    if (motivo || evo || plan) {
      const lines: string[] = [];
      if (motivo) lines.push(`Motivo: ${motivo}`);
      if (evo) lines.push(`Evolución: ${evo}`);
      if (plan) lines.push(`Plan: ${plan}`);

      pushIfAny(hitos, {
        section: "Evolución médica",
        whenStr,
        whenMs,
        title: baseTitle,
        lines,
      });
    }

    // Diagnósticos -> Diagnósticos (cronológico)
    const diags = toArray<AinsteinDiagnostico>(h.diagnosticos)
      .map((d) => (d?.diagDescripcion ? String(d.diagDescripcion).trim() : ""))
      .filter(Boolean);

    if (diags.length) {
      pushIfAny(hitos, {
        section: "Diagnósticos",
        whenStr,
        whenMs,
        title: baseTitle,
        lines: diags.map((d) => `• ${d}`),
      });
    }

    // Indicaciones farmacológicas -> Indicaciones
    const meds = toArray<AinsteinIndicacionFarmacologica>(h.indicacionFarmacologica).filter(
      (x) => x?.geneDescripcion || x?.enmeCodigo
    );

    meds.forEach((m, idx) => {
      const name = m?.geneDescripcion ? String(m.geneDescripcion).trim() : `#${m?.enmeCodigo ?? "-"}`;
      const dose = fmtDose(m?.enmeDosis, m?.tumeDescripcion);
      const via = m?.meviDescripcion ? String(m.meviDescripcion).trim() : "-";
      const freq = m?.mefrDescripcion ? String(m.mefrDescripcion).trim() : "-";

      const lines: string[] = [];
      lines.push(`Medicación: ${name}`);
      lines.push(`Dosis: ${dose}`);
      lines.push(`Vía: ${via}`);
      lines.push(`Frecuencia: ${freq}`);

      const assoc = toArray<AinsteinMedicacionAsociada>(m?.medicacionAsociada);
      if (assoc.length) {
        lines.push(`Asociada:`);
        assoc.forEach((a) => {
          const an = a?.geneDescripcion ? String(a.geneDescripcion).trim() : "-";
          lines.push(`  - ${an} • ${fmtDose(a?.enmeDosis, a?.tumeDescripcion)}`);
        });
      }

      const apps = toArray<AinsteinIndicacionFarmacologicaAplicacion>(m?.aplicaciones)
        .slice()
        .sort((a, b) => {
          const ta = toMsFromAnyDateLike(a?.panoFechaAtencion);
          const tb = toMsFromAnyDateLike(b?.panoFechaAtencion);
          return ta - tb;
        });

      if (apps.length) {
        lines.push(`Aplicaciones:`);
        apps.forEach((a) => {
          const aw = a?.panoFechaAtencion ? fmtDt(a.panoFechaAtencion) : "-";
          const desc = a?.nomeDescripcion ? String(a.nomeDescripcion).trim() : "-";
          lines.push(`  - [${aw}] ${desc}`);
        });
      }

      pushIfAny(hitos, {
        section: "Indicaciones",
        whenStr,
        whenMs,
        title: `${baseTitle} • ${name} (${idx + 1}/${meds.length})`,
        lines,
      });
    });

    // Indicaciones de enfermería -> Hoja de enfermería
    const enf = toArray<AinsteinIndicacionEnfermeria>(h.indicacionEnfermeria).filter(
      (x) => x?.indiDescripcion || x?.eninCodigo
    );

    enf.forEach((x) => {
      const desc = x?.indiDescripcion ? String(x.indiDescripcion).trim() : "-";
      const obs = x?.eninObservacion ? stripHtml(x.eninObservacion) : "";
      const lines = [desc];
      if (obs) lines.push(`Obs: ${obs}`);

      pushIfAny(hitos, {
        section: "Hoja de enfermería",
        whenStr,
        whenMs,
        title: baseTitle,
        lines,
      });
    });

    // Procedimientos -> Procedimientos / estudios
    const procs = toArray<AinsteinIndicacionProcedimiento>(h.indicacionProcedimientos).filter(
      (x) => x?.procDescripcion || x?.enprCodigo
    );

    procs.forEach((x) => {
      const desc = x?.procDescripcion ? String(x.procDescripcion).trim() : "-";
      const obs = x?.enprObservacion ? stripHtml(x.enprObservacion) : "";
      const lines = [desc];
      if (obs) lines.push(`Obs: ${obs}`);

      pushIfAny(hitos, {
        section: "Procedimientos / estudios",
        whenStr,
        whenMs,
        title: baseTitle,
        lines,
      });
    });

    // Plantillas -> Plantillas
    const pls = toArray<AinsteinPlantilla>(h.plantillas).filter((x) => x?.grupDescripcion);
    pls.forEach((t) => {
      const tname = t?.grupDescripcion ? String(t.grupDescripcion).trim() : "Plantilla";
      const props = toArray<AinsteinPlantillaPropiedad>(t?.propiedades);
      const lines: string[] = [`${tname}`];

      if (!props.length) {
        lines.push("(Sin propiedades)");
      } else {
        props.forEach((pr, j) => {
          const k = pr?.grprDescripcion ? String(pr.grprDescripcion).trim() : `Campo ${j + 1}`;
          const opciones = toArray<AinsteinPlantillaOpcion>(pr?.opciones);
          const v =
            opciones.length > 0
              ? opciones
                .map((o) => (o?.grpoDescripcion ? String(o.grpoDescripcion).trim() : ""))
                .filter(Boolean)
                .join(", ")
              : stripHtml(pr?.engpValor);
          lines.push(`• ${k}: ${v || "-"}`);
        });
      }

      pushIfAny(hitos, {
        section: "Plantillas",
        whenStr,
        whenMs,
        title: baseTitle,
        lines,
      });
    });

    // Si hay un tipo de registro que no cayó en nada, lo ponemos en "Otros" (cabecera útil)
    const hasAny =
      !!motivo ||
      !!evo ||
      !!plan ||
      diags.length > 0 ||
      meds.length > 0 ||
      enf.length > 0 ||
      procs.length > 0 ||
      pls.length > 0;

    if (!hasAny) {
      pushIfAny(hitos, {
        section: "Otros",
        whenStr,
        whenMs,
        title: baseTitle,
        lines: [`(Registro sin detalle clínico — solo cabecera)`],
      });
    }
  });

  // Agrupación por secciones + orden cronológico dentro de cada sección
  const bySection = new Map<string, Hito[]>();
  hitos.forEach((h) => {
    const arr = bySection.get(h.section) || [];
    arr.push(h);
    bySection.set(h.section, arr);
  });

  const order = [
    "Ingreso de paciente",
    "Evolución médica",
    "Diagnósticos",
    "Indicaciones",
    "Hoja de enfermería",
    "Procedimientos / estudios",
    "Plantillas",
    "Otros",
  ];

  order.forEach((sec) => {
    const arr = bySection.get(sec);
    if (!arr || !arr.length) return;

    arr.sort((a, b) => {
      const ta = a.whenMs || 0;
      const tb = b.whenMs || 0;
      if (ta === tb) return (a.title || "").localeCompare(b.title || "");
      return ta - tb;
    });

    out.push(`==============================`);
    out.push(sec.toUpperCase());
    out.push(`==============================`);

    arr.forEach((h) => {
      const head = `- [${h.whenStr || "-"}] ${h.title}`;
      out.push(head);
      h.lines.forEach((ln) => {
        out.push(`  ${ln}`);
      });
      out.push("");
    });
  });

  // Si el backend trae un texto “real” (no JSONish), lo incluimos al final como “Texto original”
  const raw = doc.text ? String(doc.text) : "";
  if (raw && !isJsonishText(raw)) {
    out.push(`==============================`);
    out.push(`TEXTO ORIGINAL (EXTRAÍDO)`);
    out.push(`==============================`);
    out.push(raw);
    out.push("");
  }

  return out.join("\n");
}

export default function PatientsList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<PacienteItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal de importación
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brainThinking, setBrainThinking] = useState(false);

  // Estado de ordenamiento: por defecto ordenar por Fecha EPC ascendente (A-Z)
  type SortField = "apellido" | "nombre" | "epc_created_at";
  type SortDirection = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("epc_created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // ---- Modal lector HCE ----
  const [hceOpen, setHceOpen] = useState(false);
  const [hceLoading, setHceLoading] = useState(false);
  const [hceError, setHceError] = useState<string | null>(null);
  const [hcePatient, setHcePatient] = useState<PacienteItem | null>(null);
  const [hceDoc, setHceDoc] = useState<HceDoc | null>(null);
  const [hceTab, setHceTab] = useState<"vista" | "texto" | "json">("vista");
  const [expandedEntr, setExpandedEntr] = useState<Record<number, boolean>>({});

  // Cancelaciones (evita race conditions entre paginado/filtros)
  const listAbortRef = useRef<AbortController | null>(null);
  const hceAbortRef = useRef<AbortController | null>(null);

  const estadoLabel = useMemo(() => {
    if (!estadoFilter) return "Todos";
    const found = ESTADOS.find((e) => e.key === estadoFilter);
    return found ? found.label : "Todos";
  }, [estadoFilter]);

  // Ordenamiento de items
  const sortedItems = useMemo(() => {
    const sorted = [...items];
    sorted.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      switch (sortField) {
        case "apellido":
          valA = (a.apellido || "").toLowerCase();
          valB = (b.apellido || "").toLowerCase();
          break;
        case "nombre":
          valA = (a.nombre || "").toLowerCase();
          valB = (b.nombre || "").toLowerCase();
          break;
        case "epc_created_at":
          // Para fechas, usamos timestamp. Items sin fecha van al final
          valA = a.epc_created_at ? new Date(a.epc_created_at).getTime() : (sortDirection === "asc" ? Infinity : -Infinity);
          valB = b.epc_created_at ? new Date(b.epc_created_at).getTime() : (sortDirection === "asc" ? Infinity : -Infinity);
          break;
        default:
          valA = "";
          valB = "";
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [items, sortField, sortDirection]);

  // Reset de página al cambiar filtros/búsqueda (evita quedarte en pág. 8 y ver “vacío”)
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoFilter, debouncedSearch]);

  async function fetchData() {
    try {
      // Cancel anterior
      if (listAbortRef.current) listAbortRef.current.abort();
      const controller = new AbortController();
      listAbortRef.current = controller;

      setLoading(true);
      setError(null);
      const params: any = {
        page,
        page_size: pageSize,
      };
      if (estadoFilter) params.estado = estadoFilter;
      if (debouncedSearch.trim()) params.q = debouncedSearch.trim();

      const { data } = await api.get<ListResponse>("/patients", {
        params,
        signal: controller.signal,
      });

      setItems(data.items);
      setTotal(data.total);
      setHasNext(data.has_next);
      setHasPrev(data.has_prev);
    } catch (e: any) {
      // Si fue abort, ignoramos
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      setError(formatError(e, "Error al cargar pacientes"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    return () => {
      if (listAbortRef.current) listAbortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, estadoFilter, debouncedSearch]);

  // Calcular total de páginas
  const totalPages = Math.ceil(total / pageSize) || 1;

  // Generar array de páginas a mostrar (max 5 visibles)
  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Mostrar todas las páginas
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Siempre mostrar primera página
      pages.push(1);

      if (page > 3) pages.push('ellipsis');

      // Páginas alrededor de la actual
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (page < totalPages - 2) pages.push('ellipsis');

      // Siempre mostrar última página
      if (totalPages > 1) pages.push(totalPages);
    }

    return pages;
  };

  // Cambiar pageSize y resetear a página 1
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  async function openEpc(p: PacienteItem, shouldGenerate: boolean) {
    try {
      setActionLoading(p.id);
      if (shouldGenerate) setBrainThinking(true);

      const opened = await api.post("/epc/open", {
        patient_id: p.id,
        admission_id: null,
      });
      const epcId: string | undefined = opened.data?.id;

      // ⚠️ Validar que epcId sea válido antes de continuar
      if (!epcId || epcId === "undefined") {
        throw new Error("El servidor no retornó un ID de EPC válido. Por favor, intente nuevamente.");
      }

      if (shouldGenerate) {
        await api.post(`/epc/${epcId}/generate`);

        setItems((prev) =>
          prev.map((it) => (it.id === p.id ? { ...it, estado: "epc_generada" } : it))
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

  async function openHceReader(p: PacienteItem) {
    try {
      // Cancel anterior (si abrís otro paciente rápido)
      if (hceAbortRef.current) hceAbortRef.current.abort();
      const controller = new AbortController();
      hceAbortRef.current = controller;

      setHceError(null);
      setHceLoading(true);
      setHceOpen(true);
      setHcePatient(p);
      setHceDoc(null);
      setHceTab("vista");
      setExpandedEntr({});

      // ✅ Endpoint esperado: GET /hce/latest?patient_id=...&include_text=1
      const { data } = await api.get<HceDoc>("/hce/latest", {
        params: { patient_id: p.id, include_text: 1 },
        signal: controller.signal,
      });

      setHceDoc(data);
    } catch (e: any) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      setHceError(formatError(e, "No se pudo abrir la HCE"));
      setHceDoc(null);
    } finally {
      setHceLoading(false);
    }
  }

  function closeHceReader() {
    if (hceAbortRef.current) hceAbortRef.current.abort();
    setHceOpen(false);
    setHceLoading(false);
    setHceError(null);
    setHcePatient(null);
    setHceDoc(null);
    setHceTab("vista");
    setExpandedEntr({});
  }

  const hasAinsteinHistoria = useMemo(() => {
    const hist = hceDoc?.ainstein?.historia;
    return Array.isArray(hist) && hist.length > 0;
  }, [hceDoc]);

  const episodio = useMemo<AinsteinEpisodio | null>(() => {
    const ep = hceDoc?.ainstein?.episodio as any;
    if (!ep || typeof ep !== "object") return null;
    return ep as AinsteinEpisodio;
  }, [hceDoc]);

  const ubicacion = useMemo(() => {
    const movs = toArray<AinsteinMovimiento>(episodio?.movimientos);
    const m0 = movs[0];
    const sala = m0?.salaDescripcion ? String(m0.salaDescripcion).trim() : "";
    const unidad = m0?.nicuDescripcion ? String(m0.nicuDescripcion).trim() : "";
    const when = m0?.inmoFechaDesde ? fmtDt(m0.inmoFechaDesde) : "";
    const label = [sala, unidad].filter(Boolean).join(" • ");
    return {
      label: label || "-",
      when: when || "-",
    };
  }, [episodio]);

  const structuredSummary = useMemo(() => {
    const s = hceDoc?.structured || {};
    const ingreso =
      s?.fecha_ingreso ||
      s?.ainstein?.inteFechaIngreso ||
      s?.inteFechaIngreso ||
      episodio?.inteFechaIngreso;

    const egresoOriginal =
      s?.fecha_egreso_original ||
      s?.fecha_egreso ||
      episodio?.inteFechaEgreso;

    return {
      // visibles
      fecha_ingreso: ingreso ? fmtDt(String(ingreso)) : "-",
      fecha_egreso_original: egresoOriginal ? fmtDt(String(egresoOriginal)) : "-",
      sector: s?.sector || s?.nicuDescripcion || s?.salaDescripcion || "-",
      habitacion: s?.habitacion || "-",
      cama: s?.cama || "-",
      obra_social: s?.obra_social || hcePatient?.obra_social || "-",
      nro_beneficiario: s?.nro_beneficiario || hcePatient?.nro_beneficiario || "-",
      estado_internacion: s?.estado_internacion || hcePatient?.estado || "-",
      protocolo: s?.protocolo || "-",
      admision_num: s?.admision_num || hcePatient?.hce_numero || "-",
      sexo: s?.sexo || episodio?.paciSexo || "-",
      edad: s?.edad || episodio?.paciEdad || "-",
      dias_estada: s?.dias_estada || episodio?.inteDiasEstada || "-",
      tipo_alta: s?.tipo_alta || episodio?.taltDescripcion || "-",

      // crudos (para ordenar por fecha si hiciera falta)
      fecha_ingreso_raw: ingreso ? String(ingreso) : null,
      fecha_egreso_raw: egresoOriginal ? String(egresoOriginal) : null,
    };
  }, [hceDoc, hcePatient, episodio]);

  function toggleAll(open: boolean) {
    const hist = toArray<AinsteinHistoriaEntrada>(hceDoc?.ainstein?.historia);
    const next: Record<number, boolean> = {};
    hist.forEach((h) => (next[h.entrCodigo] = open));
    setExpandedEntr(next);
  }

  function renderDiagnosticos(diags: AinsteinDiagnostico[] | null | undefined) {
    const arr = toArray<AinsteinDiagnostico>(diags);
    if (!arr.length) return null;
    const rows = arr
      .map((d) => (d?.diagDescripcion ? String(d.diagDescripcion).trim() : ""))
      .filter(Boolean);
    if (!rows.length) return null;

    return (
      <div className="hce-block">
        <div className="hce-block__k">
          <span className="hce-ico">
            <FaStethoscope />
          </span>
          Diagnósticos
        </div>
        <div className="hce-block__v">
          <ul className="hce-list">
            {rows.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  function renderFarmacos(f: AinsteinIndicacionFarmacologica[] | null | undefined) {
    const arr = toArray<AinsteinIndicacionFarmacologica>(f);
    if (!arr.length) return null;

    const usable = arr.filter((x) => x?.geneDescripcion || x?.enmeCodigo);
    if (!usable.length) return null;

    return (
      <div className="hce-block">
        <div className="hce-block__k">
          <span className="hce-ico">
            <FaSyringe />
          </span>
          Indicación farmacológica
        </div>
        <div className="hce-block__v">
          <div className="hce-table">
            <div className="hce-table__head">
              <div>Medicación</div>
              <div>Dosis</div>
              <div>Vía</div>
              <div>Frecuencia</div>
            </div>
            {usable.map((m, idx) => {
              const name = m?.geneDescripcion
                ? String(m.geneDescripcion).trim()
                : `#${m?.enmeCodigo ?? "-"}`;
              const dose = fmtDose(m?.enmeDosis, m?.tumeDescripcion);
              const via = m?.meviDescripcion ? String(m.meviDescripcion).trim() : "-";
              const freq = m?.mefrDescripcion ? String(m.mefrDescripcion).trim() : "-";
              const assoc = toArray<AinsteinMedicacionAsociada>(m?.medicacionAsociada);
              const apps = toArray<AinsteinIndicacionFarmacologicaAplicacion>(m?.aplicaciones);

              return (
                <div key={`${m?.enmeCodigo ?? "m"}-${idx}`} className="hce-table__row">
                  <div className="hce-strong">{name}</div>
                  <div className="mono">{dose}</div>
                  <div>{via}</div>
                  <div>{freq}</div>

                  {(assoc.length > 0 || apps.length > 0) && (
                    <div className="hce-table__sub">
                      {assoc.length > 0 && (
                        <div className="hce-subsection">
                          <div className="hce-subsection__t">Asociada</div>
                          <ul className="hce-list hce-list--compact">
                            {assoc.map((a, j) => (
                              <li key={`${a?.enmeCodigo ?? "a"}-${j}`}>
                                <span className="hce-strong">
                                  {a?.geneDescripcion ? String(a.geneDescripcion).trim() : "-"}
                                </span>
                                <span className="mono">
                                  {" "}
                                  • {fmtDose(a?.enmeDosis, a?.tumeDescripcion)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {apps.length > 0 && (
                        <div className="hce-subsection">
                          <div className="hce-subsection__t">Aplicaciones</div>
                          <ul className="hce-list hce-list--compact">
                            {apps.map((a, j) => (
                              <li key={`${a?.panoFechaAtencion ?? "p"}-${j}`}>
                                <span className="mono">{fmtDt(a?.panoFechaAtencion || null)}</span>
                                {" — "}
                                <span>{a?.nomeDescripcion ? String(a.nomeDescripcion).trim() : "-"}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderProcedimientos(p: AinsteinIndicacionProcedimiento[] | null | undefined) {
    const arr = toArray<AinsteinIndicacionProcedimiento>(p);
    if (!arr.length) return null;
    const usable = arr.filter((x) => x?.procDescripcion || x?.enprCodigo);
    if (!usable.length) return null;

    return (
      <div className="hce-block">
        <div className="hce-block__k">
          <span className="hce-ico">
            <FaProcedures />
          </span>
          Procedimientos / estudios
        </div>
        <div className="hce-block__v">
          <ul className="hce-list">
            {usable.map((x, idx) => (
              <li key={`${x?.enprCodigo ?? "p"}-${idx}`}>
                <span className="hce-strong">
                  {x?.procDescripcion ? String(x.procDescripcion).trim() : "-"}
                </span>
                {x?.enprObservacion ? (
                  <div className="hce-muted hce-muted--pad">{stripHtml(x.enprObservacion)}</div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  function renderEnfermeria(e: AinsteinIndicacionEnfermeria[] | null | undefined) {
    const arr = toArray<AinsteinIndicacionEnfermeria>(e);
    if (!arr.length) return null;
    const usable = arr.filter((x) => x?.indiDescripcion || x?.eninCodigo);
    if (!usable.length) return null;

    return (
      <div className="hce-block">
        <div className="hce-block__k">
          <span className="hce-ico">
            <FaUserNurse />
          </span>
          Enfermería
        </div>
        <div className="hce-block__v">
          <ul className="hce-list">
            {usable.map((x, idx) => (
              <li key={`${x?.eninCodigo ?? "e"}-${idx}`}>
                <span className="hce-strong">
                  {x?.indiDescripcion ? String(x.indiDescripcion).trim() : "-"}
                </span>
                {x?.eninObservacion ? (
                  <div className="hce-muted hce-muted--pad">{stripHtml(x.eninObservacion)}</div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  function renderPlantillas(p: AinsteinPlantilla[] | null | undefined) {
    const arr = toArray<AinsteinPlantilla>(p);
    if (!arr.length) return null;

    const usable = arr.filter((x) => x?.grupDescripcion);
    if (!usable.length) return null;

    return (
      <div className="hce-block">
        <div className="hce-block__k">
          <span className="hce-ico">
            <FaClipboardList />
          </span>
          Plantillas
        </div>
        <div className="hce-block__v">
          {usable.map((t, idx) => {
            const props = toArray<AinsteinPlantillaPropiedad>(t?.propiedades);
            return (
              <div key={`${t?.grupDescripcion ?? "tpl"}-${idx}`} className="hce-template">
                <div className="hce-template__t">
                  {String(t.grupDescripcion || "Plantilla").trim()}
                </div>

                {props.length === 0 ? (
                  <div className="hce-muted">(Sin propiedades)</div>
                ) : (
                  <div className="hce-kv">
                    {props.map((pr, j) => {
                      const k = pr?.grprDescripcion
                        ? String(pr.grprDescripcion).trim()
                        : `Campo ${j + 1}`;
                      const opciones = toArray<AinsteinPlantillaOpcion>(pr?.opciones);
                      const v =
                        opciones.length > 0
                          ? opciones
                            .map((o) =>
                              o?.grpoDescripcion ? String(o.grpoDescripcion).trim() : ""
                            )
                            .filter(Boolean)
                            .join(", ")
                          : stripHtml(pr?.engpValor);

                      return (
                        <div key={`${pr?.engpCodigo ?? "p"}-${j}`} className="hce-kv__row">
                          <div className="hce-kv__k">{k}</div>
                          <div className="hce-kv__v">{v || "-"}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderMotivoEvoPlan(h: AinsteinHistoriaEntrada) {
    const hasMotivo = !!h.entrMotivoConsulta;
    const hasEvo = !!h.entrEvolucion;
    const hasPlan = !!h.entrPlan;

    if (!hasMotivo && !hasEvo && !hasPlan) return null;

    return (
      <>
        {hasMotivo ? (
          <div className="hce-block">
            <div className="hce-block__k">Motivo</div>
            <div className="hce-block__v">
              <pre className="hce-pre">{safeText(h.entrMotivoConsulta)}</pre>
            </div>
          </div>
        ) : null}

        {hasEvo ? (
          <div className="hce-block">
            <div className="hce-block__k">Evolución</div>
            <div className="hce-block__v">
              <pre className="hce-pre">{safeText(h.entrEvolucion)}</pre>
            </div>
          </div>
        ) : null}

        {hasPlan ? (
          <div className="hce-block">
            <div className="hce-block__k">Plan</div>
            <div className="hce-block__v">
              <pre className="hce-pre">{safeText(h.entrPlan)}</pre>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  const groupedText = useMemo(() => {
    if (!hceDoc) return "(Sin texto)";
    return buildGroupedClinicalText({
      doc: hceDoc,
      patient: hcePatient,
      structuredSummary,
      episodio,
      ubicacion,
    });
  }, [hceDoc, hcePatient, structuredSummary, episodio, ubicacion]);

  return (
    <div className="patients-page">
      <div className="patients-page__header">
        <div>
          <h1>Pacientes</h1>
          <p className="subtitle">
            Gestión de pacientes internados, generación de EPC y estados de alta.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn--primary"
            onClick={() => setImportModalOpen(true)}
          >
            <FaPlus /> Importar Paciente
          </button>
        </div>
      </div>

      <div className="patients-filters">
        <div className="filter-group">
          <FaFilter className="filter-icon" />
          <select
            value={estadoFilter || ""}
            onChange={(e) => setEstadoFilter(e.target.value === "" ? null : e.target.value)}
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

        {/* Ordenamiento */}
        <div className="filter-group sort-group">
          {sortDirection === "asc" ? (
            <FaSortAlphaDown className="filter-icon" />
          ) : (
            <FaSortAlphaUpAlt className="filter-icon" />
          )}
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as "apellido" | "nombre" | "epc_created_at")}
          >
            <option value="epc_created_at">Fecha EPC</option>
            <option value="apellido">Apellido</option>
            <option value="nombre">Nombre</option>
          </select>
          <button
            className="sort-direction-btn"
            onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
            title={sortDirection === "asc" ? "Orden A-Z (ascendente)" : "Orden Z-A (descendente)"}
          >
            {sortDirection === "asc" ? "A-Z" : "Z-A"}
          </button>
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
                <th className="col-num">#</th>
                <th className="col-apellido">Apellido</th>
                <th className="col-nombre">Nombre</th>
                <th className="col-edad">Edad</th>
                <th className="col-sexo">Sexo</th>
                <th className="col-ingreso">Ingreso</th>
                <th className="col-egreso">Egreso</th>
                <th className="col-dias">Días</th>
                <th className="col-alta">Alta</th>
                <th className="col-estado">Estado</th>
                <th className="col-generado-por">Generado por</th>
                <th className="col-fecha-epc">Fecha EPC</th>
                <th className="th-actions col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={13} style={{ textAlign: "center" }}>
                    Cargando…
                  </td>
                </tr>
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={13} style={{ textAlign: "center" }}>
                    No hay pacientes que coincidan con los filtros actuales.
                  </td>
                </tr>
              )}

              {!loading &&
                sortedItems.map((p, idx) => {
                  const isGenerated = p.estado === "epc_generada";
                  const isProcessing = actionLoading === p.id;
                  const rowNum = (page - 1) * pageSize + idx + 1;

                  return (
                    <tr key={p.id}>
                      <td className="col-num">{rowNum}</td>
                      <td className="col-apellido" data-label="Apellido">
                        <div className="patient-cell">
                          <div className="patient-main">{p.apellido}</div>
                          <div className="patient-sub">{p.dni ? `DNI ${p.dni}` : "DNI -"}</div>
                        </div>
                      </td>

                      <td className="col-nombre" data-label="Nombre">
                        <div className="patient-cell">
                          <div className="patient-main">{p.nombre}</div>
                          <div className="patient-sub">
                            {p.obra_social ? p.obra_social : "Obra social -"}
                          </div>
                        </div>
                      </td>

                      <td className="col-edad">
                        <span className="badge badge--hce">{p.edad ?? "-"}</span>
                      </td>
                      <td className="col-sexo">
                        <span className="badge badge--hce">{p.sexo ?? "-"}</span>
                      </td>
                      <td className="col-ingreso">
                        <span className="badge badge--hce">
                          {p.fecha_ingreso ? new Date(p.fecha_ingreso).toLocaleDateString() : "-"}
                        </span>
                      </td>
                      <td className="col-egreso">
                        <span className="badge badge--hce">
                          {p.fecha_egreso ? new Date(p.fecha_egreso).toLocaleDateString() : "-"}
                        </span>
                      </td>
                      <td className="col-dias">
                        <span className="badge badge--hce">{p.dias_estada ?? "-"}</span>
                      </td>
                      <td className="col-alta">
                        <span className="badge badge--hce">{p.tipo_alta ?? "-"}</span>
                      </td>

                      <td className="state-cell col-estado" data-label="Estado">
                        {p.estado === "internacion" && (
                          <span className="badge badge--yellow" title="Internación">
                            <FaBed />
                          </span>
                        )}
                        {p.estado === "falta_epc" && (
                          <span className="badge badge--orange" title="Falta EPC">
                            <FaClock />
                          </span>
                        )}
                        {p.estado === "epc_generada" && (
                          <span className="badge badge--green" title="EPC generada">
                            <FaCheckCircle />
                          </span>
                        )}
                        {p.estado === "alta" && (
                          <span className="badge badge--blue" title="Alta">
                            <FaFileSignature />
                          </span>
                        )}
                        {!p.estado && <span className="badge" title="Sin estado">-</span>}
                      </td>

                      <td className="col-generado-por" data-label="Generado por">
                        {p.epc_created_by_name || "-"}
                      </td>

                      <td className="col-fecha-epc" data-label="Fecha EPC">
                        {p.epc_created_at ? (
                          <div className="datetime-stack">
                            <div className="dt-date">
                              {new Date(p.epc_created_at).toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </div>
                            <div className="dt-time">
                              {new Date(p.epc_created_at).toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="actions-cell col-actions" data-label="Acciones">
                        <div className="actions-grid">
                          {/* 1. Ver/Generar EPC */}
                          <button
                            className={`grid-btn grid-btn--epc${isProcessing ? " is-loading" : ""}`}
                            onClick={() =>
                              openEpc(
                                p,
                                !(p.estado === "epc_generada" || p.estado === "alta")
                              )
                            }
                            disabled={!!actionLoading}
                            title={isGenerated ? "Ver EPC" : "Generar EPC"}
                          >
                            {isGenerated ? <FaFileSignature /> : <FaNotesMedical />}
                          </button>

                          {/* 2. Ver HCE */}
                          <button
                            className="grid-btn grid-btn--view"
                            onClick={() => openHceReader(p)}
                            disabled={!!actionLoading}
                            title="Ver Historia Clínica"
                          >
                            <FaEye />
                          </button>

                          {/* Admin actions */}
                          {user?.role === "admin" && (
                            <>
                              <button
                                className="grid-btn grid-btn--edit"
                                onClick={() => navigate(`/patients/${p.id}/edit`)}
                                disabled={!!actionLoading}
                                title="Editar Paciente"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="grid-btn grid-btn--delete"
                                onClick={() => handleDelete(p.id)}
                                disabled={!!actionLoading}
                                title="Eliminar Paciente"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Paginación Profesional */}
        <div className="patients-pagination-pro">
          {/* Selector de cantidad */}
          <div className="pagination-size-selector">
            <span className="pagination-label">Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="pagination-select"
              disabled={loading}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="pagination-label">por página</span>
          </div>

          {/* Info de resultados */}
          <div className="pagination-info">
            {total > 0 ? (
              <>
                <span className="pagination-range">
                  {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)}
                </span>
                <span className="pagination-of"> de </span>
                <span className="pagination-total">{total}</span>
              </>
            ) : (
              <span>Sin resultados</span>
            )}
          </div>

          {/* Navegación de páginas */}
          <div className="pagination-nav">
            {/* Primera página */}
            <button
              className="pagination-btn"
              disabled={page === 1 || loading}
              onClick={() => setPage(1)}
              title="Primera página"
            >
              <FaAngleDoubleLeft />
            </button>

            {/* Anterior */}
            <button
              className="pagination-btn"
              disabled={!hasPrev || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              title="Anterior"
            >
              <FaChevronLeft />
            </button>

            {/* Números de página */}
            <div className="pagination-numbers">
              {getVisiblePages().map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
                ) : (
                  <button
                    key={p}
                    className={`pagination-num ${page === p ? 'active' : ''}`}
                    disabled={loading}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            {/* Siguiente */}
            <button
              className="pagination-btn"
              disabled={!hasNext || loading}
              onClick={() => setPage((p) => p + 1)}
              title="Siguiente"
            >
              <FaChevronRight />
            </button>

            {/* Última página */}
            <button
              className="pagination-btn"
              disabled={page === totalPages || loading}
              onClick={() => setPage(totalPages)}
              title="Última página"
            >
              <FaAngleDoubleRight />
            </button>
          </div>
        </div>
      </div>

      {
        error && (
          <div className="patients-error">
            {error}
          </div>
        )
      }

      {
        brainThinking && (
          <div className="epc-thinking-overlay">
            <div className="epc-thinking-card">
              <div className="epc-brain">
                <div className="epc-brain-core" />
              </div>
              <div className="epc-thinking-text">Generando Epicrisis con IA…</div>
              <div className="epc-progress">
                <div className="epc-progress-bar" />
              </div>
              <div className="epc-thinking-sub">Analizando HCE, CIE-10 y contexto clínico…</div>
            </div>
          </div>
        )
      }

      {/* Modal de Importación HCE */}
      {
        importModalOpen && (
          <ImportHceModal
            onClose={() => setImportModalOpen(false)}
            onImportSuccess={() => {
              setImportModalOpen(false);
              fetchData();
            }}
          />
        )
      }



      {/* =========================
          Modal Lector HCE
         ========================= */}
      {
        hceOpen && (
          <div className="hce-modal__overlay" onClick={closeHceReader} role="dialog" aria-modal="true">
            <div className="hce-modal" onClick={(e) => e.stopPropagation()}>
              <div className="hce-modal__top">
                <div className="hce-modal__title">
                  <div className="hce-modal__h1">Lectura de HCE</div>
                  <div className="hce-modal__sub">
                    {hcePatient ? `${hcePatient.apellido} ${hcePatient.nombre} • ID ${hcePatient.id}` : "-"}
                  </div>
                </div>

                <button className="hce-modal__close" onClick={closeHceReader} title="Cerrar">
                  <FaTimes />
                </button>
              </div>

              <div className="hce-modal__tabs">
                <button
                  className={`hce-tab ${hceTab === "vista" ? "is-active" : ""}`}
                  onClick={() => setHceTab("vista")}
                  disabled={hceLoading}
                >
                  Vista clínica
                </button>
                <button
                  className={`hce-tab ${hceTab === "texto" ? "is-active" : ""}`}
                  onClick={() => setHceTab("texto")}
                  disabled={hceLoading}
                >
                  Texto
                </button>
                <button
                  className={`hce-tab ${hceTab === "json" ? "is-active" : ""}`}
                  onClick={() => setHceTab("json")}
                  disabled={hceLoading}
                >
                  JSON
                </button>
              </div>

              <div className="hce-modal__body">
                {hceLoading && <div className="hce-loading">Cargando HCE…</div>}

                {!hceLoading && hceError && <div className="hce-error">{hceError}</div>}

                {!hceLoading && !hceError && !hceDoc && (
                  <div className="hce-empty">No se encontró HCE para este paciente.</div>
                )}

                {!hceLoading && !hceError && hceDoc && (
                  <>
                    {hceTab === "vista" && (
                      <div className="hce-vista">
                        <div className="hce-kpis">
                          <div className="hce-kpi">
                            <div className="hce-kpi__k">Ingreso</div>
                            <div className="hce-kpi__v">{structuredSummary.fecha_ingreso}</div>
                          </div>
                          <div className="hce-kpi">
                            <div className="hce-kpi__k">Egreso (orig)</div>
                            <div className="hce-kpi__v">{structuredSummary.fecha_egreso_original}</div>
                          </div>
                          <div className="hce-kpi">
                            <div className="hce-kpi__k">Sexo</div>
                            <div className="hce-kpi__v">
                              <span className="hce-inline">
                                <FaVenusMars /> {String(structuredSummary.sexo)}
                              </span>
                            </div>
                          </div>
                          <div className="hce-kpi">
                            <div className="hce-kpi__k">Edad</div>
                            <div className="hce-kpi__v">
                              <span className="hce-inline">
                                <FaUser /> {String(structuredSummary.edad)}
                              </span>
                            </div>
                          </div>

                          <div className="hce-kpi">
                            <div className="hce-kpi__k">Ubicación</div>
                            <div className="hce-kpi__v">
                              <span className="hce-inline">
                                <FaHospitalAlt /> {ubicacion.label}
                              </span>
                              <div className="hce-muted hce-muted--mini mono">Desde {ubicacion.when}</div>
                            </div>
                          </div>

                          <div className="hce-kpi">
                            <div className="hce-kpi__k">Hab.</div>
                            <div className="hce-kpi__v">{structuredSummary.habitacion}</div>
                          </div>
                          <div className="hce-kpi">
                            <div className="hce-kpi__k">Cama</div>
                            <div className="hce-kpi__v">{structuredSummary.cama}</div>
                          </div>

                          <div className="hce-kpi">
                            <div className="hce-kpi__k">Obra social</div>
                            <div className="hce-kpi__v">{structuredSummary.obra_social}</div>
                          </div>
                          <div className="hce-kpi">
                            <div className="hce-kpi__k">Benef.</div>
                            <div className="hce-kpi__v">{structuredSummary.nro_beneficiario}</div>
                          </div>

                          <div className="hce-kpi">
                            <div className="hce-kpi__k">Adm/Protocolo</div>
                            <div className="hce-kpi__v">
                              {structuredSummary.admision_num} • {structuredSummary.protocolo}
                            </div>
                          </div>

                          <div className="hce-kpi">
                            <div className="hce-kpi__k">Días estada</div>
                            <div className="hce-kpi__v">{String(structuredSummary.dias_estada)}</div>
                          </div>
                          <div className="hce-kpi">
                            <div className="hce-kpi__k">Tipo alta</div>
                            <div className="hce-kpi__v">{String(structuredSummary.tipo_alta)}</div>
                          </div>
                        </div>

                        {hasAinsteinHistoria && (
                          <div className="hce-actionsbar">
                            <button className="hce-mini-btn" onClick={() => toggleAll(true)}>
                              <FaChevronDown /> Expandir todo
                            </button>
                            <button className="hce-mini-btn" onClick={() => toggleAll(false)}>
                              <FaChevronRight /> Colapsar todo
                            </button>
                          </div>
                        )}

                        {hasAinsteinHistoria && (
                          <div className="hce-section">
                            <div className="hce-section__title">
                              <span className="hce-ico">
                                <FaRegListAlt />
                              </span>
                              Historia clínica (Ainstein)
                            </div>

                            <div className="hce-accordion">
                              {toArray<AinsteinHistoriaEntrada>(hceDoc.ainstein?.historia).map((h) => {
                                const open = !!expandedEntr[h.entrCodigo];
                                const title = h.entrTipoRegistro || "Registro";
                                const when = h.entrFechaAtencion ? fmtDt(h.entrFechaAtencion) : "-";

                                return (
                                  <div key={h.entrCodigo} className="hce-acc-item">
                                    <button
                                      className="hce-acc-head"
                                      onClick={() =>
                                        setExpandedEntr((p) => ({
                                          ...p,
                                          [h.entrCodigo]: !p[h.entrCodigo],
                                        }))
                                      }
                                    >
                                      <span className="hce-acc-icon" aria-hidden="true">
                                        {open ? <FaChevronDown /> : <FaChevronRight />}
                                      </span>

                                      <span className="hce-acc-title">
                                        {title} <span className="mono">#{h.entrCodigo}</span>
                                      </span>

                                      <span className="hce-acc-when mono">{when}</span>
                                    </button>

                                    {open && (
                                      <div className="hce-acc-body">
                                        {renderMotivoEvoPlan(h)}
                                        {renderDiagnosticos(h.diagnosticos)}
                                        {renderFarmacos(h.indicacionFarmacologica)}
                                        {renderProcedimientos(h.indicacionProcedimientos)}
                                        {renderEnfermeria(h.indicacionEnfermeria)}
                                        {renderPlantillas(h.plantillas)}

                                        {!h.entrMotivoConsulta &&
                                          !h.entrEvolucion &&
                                          !h.entrPlan &&
                                          toArray(h.diagnosticos).length === 0 &&
                                          toArray(h.indicacionFarmacologica).length === 0 &&
                                          toArray(h.indicacionProcedimientos).length === 0 &&
                                          toArray(h.indicacionEnfermeria).length === 0 &&
                                          toArray(h.plantillas).length === 0 && (
                                            <div className="hce-muted">
                                              No hay contenido clínico detallado en este registro (solo cabecera).
                                            </div>
                                          )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {!hasAinsteinHistoria && (
                          <div className="hce-section">
                            <div className="hce-section__title">Contenido</div>
                            <div className="hce-muted">
                              Esta HCE no trae historia Ainstein. Podés verla en pestaña “Texto” o “JSON”.
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {hceTab === "texto" && (
                      <div className="hce-texto">
                        <div className="hce-section">
                          <div className="hce-section__title">
                            <span className="hce-ico">
                              <FaNotesMedical />
                            </span>
                            Texto consolidado por secciones (cronológico)
                          </div>

                          <pre className="hce-pre hce-pre--big">
                            {groupedText || "(Sin texto)"}
                          </pre>

                          <div className="hce-muted hce-muted--pad">
                            Nota: si el backend envía un <code>text</code> “metadata” tipo JSON (source/inteCodigo/paciCodigo),
                            esta vista lo ignora y reconstruye el texto desde Ainstein (historia/indicaciones/enfermería).
                          </div>
                        </div>
                      </div>
                    )}

                    {hceTab === "json" && (
                      <div className="hce-json">
                        <div className="hce-section">
                          <div className="hce-section__title">
                            <span className="hce-ico">
                              <FaRegListAlt />
                            </span>
                            Documento completo
                          </div>
                          <pre className="hce-pre hce-pre--big">{safeText(hceDoc)}</pre>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="hce-modal__footer">
                <div className="hce-muted">
                  Tip: esta pestaña “Texto” ahora arma la salida por hitos agrupados por secciones y en orden cronológico.
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}