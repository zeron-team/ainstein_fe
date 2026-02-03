// src/pages/EPC/ViewEdit.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import axios from "axios";
import {
  FaArrowLeft,
  FaCheck,
  FaClipboard,
  FaClipboardCheck,
  FaCopy,
  FaDownload,
  FaFileMedical,
  FaPrint,
  FaSave,
  FaUserMd,
  FaBrain,
  FaPen,
  FaThumbsUp,
  FaThumbsDown,
  FaMeh,
  FaTimes,
} from "react-icons/fa";

import "./ViewEditEPC.css";

type EPC = {
  id: string;
  patient_id: string;
  admission_id?: string | null;
  estado: "borrador" | "validada" | "impresa";
  titulo?: string | null;
  diagnostico_principal_cie10?: string | null;
  fecha_emision?: string | null; // ISO
  medico_responsable?: string | null;
  firmado_por_medico?: boolean | null;
  // datos clínicos opcionales
  sector?: string | null;
  habitacion?: string | null;
  cama?: string | null;
  admision_num?: string | null;
  protocolo?: string | null;
};

type Patient = {
  id: string;
  apellido?: string | null;
  nombre?: string | null;
  dni?: string | null;
  cuil?: string | null;
  obra_social?: string | null;
  nro_beneficiario?: string | null;
  fecha_nacimiento?: string | null; // YYYY-MM-DD
  sexo?: string | null;
};

type Admission = {
  id: string;
  sector?: string | null;
  habitacion?: string | null;
  cama?: string | null;
  fecha_ingreso?: string | null; // ISO
  fecha_egreso?: string | null; // ISO
  protocolo?: string | null;
  admision_num?: string | null;
};

type Doctor = { id: string; full_name: string; username: string };

type GeneratedData =
  | {
    motivo_internacion?: string;
    diagnostico_principal_cie10?: string;
    evolucion?: string;
    procedimientos?: any[];
    interconsultas?: any[];
    medicacion?:
    | {
      farmaco: string;
      dosis?: string;
      via?: string;
      frecuencia?: string;
    }[]
    | any[];
    indicaciones_alta?: any[];
    recomendaciones?: any[];
    [k: string]: any;
  }
  | null;

type EPCEvent = {
  at: string; // fecha/hora ISO o legible
  by?: string | null; // usuario o médico
  action: string; // descripción de la acción
};

type EPCContext = {
  epc: EPC;
  patient?: Patient | null;
  admission?: Admission | null;
  demographics?: { sexo?: string | null; edad?: number | null };
  hce?: { id: string; pages?: number; created_at?: string; structured?: any } | null;
  doctors: Doctor[];
  generated?: {
    at?: string;
    hce_source_id?: string | null;
    provider?: string | null;
    model?: string | null;
    data?: GeneratedData;
  } | null;
  clinical?: any;
  history?: EPCEvent[];
};

function isoToYmd(iso?: string | null) {
  if (!iso) return "";
  try {
    const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T00:00:00");
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
}

function ymdToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Convierte cualquier valor (ISO, YYYY-MM-DD, dd/mm/yyyy, etc) a YYYY-MM-DD
function anyToYmd(val?: string | null) {
  if (!val) return "";
  const s = val.trim();
  if (!s) return "";
  if (s.includes("-")) {
    return isoToYmd(s);
  }
  if (s.includes("/")) {
    const parts = s.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const yy = y?.trim();
      const mm = String(parseInt(m || "0", 10)).padStart(2, "0");
      const dd = String(parseInt(d || "0", 10)).padStart(2, "0");
      if (yy && mm !== "NaN" && dd !== "NaN") {
        return `${yy}-${mm}-${dd}`;
      }
    }
  }
  return isoToYmd(s);
}

function fullName(p?: Patient | null) {
  const ap = (p?.apellido || "").trim();
  const no = (p?.nombre || "").trim();
  return [ap, no].filter(Boolean).join(", ");
}

// Pasa array de items (strings u objetos) a texto multilínea
function arrToMultiline(arr: any[] | undefined): string {
  if (!Array.isArray(arr) || !arr.length) return "";
  return arr
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        // Soporte especial para medicación / tratamiento terapéutico
        if ((item as any).farmaco) {
          const t = item as {
            farmaco: string;
            dosis?: string;
            via?: string;
            frecuencia?: string;
          };
          const parts = [t.farmaco, t.dosis, t.via, t.frecuencia].filter(Boolean);
          return parts.join(" · ");
        }
        return (
          (item as any).descripcion ||
          (item as any).detalle ||
          (item as any).resumen ||
          (item as any).especialidad ||
          JSON.stringify(item)
        );
      }
      return String(item ?? "");
    })
    .join("\n");
}

function multilineToArray(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

// Formatea la fecha del historial a algo legible: 21/11/2025 19:05
function formatHistoryDate(iso?: string | null) {
  if (!iso) return "";
  try {
    const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  } catch {
    return iso;
  }
}

function getAuthTokenFromStorage(): string | null {
  const candidates = [
    // tu app usa "token"
    "token",
    "access_token",
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

  // fallback: buscar objetos tipo {access_token:"..."} o {token:"..."}
  const objCandidates = ["auth", "session", "user", "tokens"];
  for (const k of objCandidates) {
    const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const v =
        parsed?.access_token ||
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

function openBlobInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob);

  // Evitamos window.open(urlDirectaApi) -> usamos <a target="_blank">
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

export default function ViewEditEPC() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Carga
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Core
  const [epc, setEpc] = useState<EPC | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [demographics, setDemographics] = useState<{
    sexo?: string | null;
    edad?: number | null;
  } | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [generated, setGenerated] = useState<EPCContext["generated"] | null>(null);
  const [history, setHistory] = useState<EPCEvent[]>([]);

  // Form
  const [titulo, setTitulo] = useState("");
  const [cie10, setCie10] = useState("");
  const [fechaEmision, setFechaEmision] = useState("");
  const [medicoId, setMedicoId] = useState("");
  const [medicoNombre, setMedicoNombre] = useState("");
  const [firmado, setFirmado] = useState(false);

  // Clínicos
  const [admNum, setAdmNum] = useState("");
  const [protocolo, setProtocolo] = useState("");
  const [fecIng, setFecIng] = useState("");
  const [fecEgr, setFecEgr] = useState("");
  const [sector, setSector] = useState("");
  const [hab, setHab] = useState("");
  const [cama, setCama] = useState("");
  const [nroHC, setNroHC] = useState("");

  // Campos EDITABLES del contenido generado (texto)
  const [motivoText, setMotivoText] = useState("");
  const [evolucionText, setEvolucionText] = useState("");
  const [procedimientosText, setProcedimientosText] = useState("");
  const [interconsultasText, setInterconsultasText] = useState("");
  const [tratamientoText, setTratamientoText] = useState("");
  const [indicacionesAltaText, setIndicacionesAltaText] = useState("");
  const [recomendacionesText, setRecomendacionesText] = useState("");

  // Datos estructurados de medicación (para separar internación vs previa)
  type MedicacionItem = {
    tipo: "internacion" | "previa";
    farmaco: string;
    dosis?: string;
    via?: string;
    frecuencia?: string;
  };
  const [medicacionData, setMedicacionData] = useState<MedicacionItem[]>([]);

  // Flags de edición por sección
  const [editingMotivo, setEditingMotivo] = useState(false);
  const [editingEvolucion, setEditingEvolucion] = useState(false);
  const [editingProc, setEditingProc] = useState(false);
  const [editingInter, setEditingInter] = useState(false);
  const [editingTrat, setEditingTrat] = useState(false);
  const [editingIndAlta, setEditingIndAlta] = useState(false);
  const [editingRecom, setEditingRecom] = useState(false);

  // Modal de Notas al Alta (Recomendaciones)
  const [notasAltaModalOpen, setNotasAltaModalOpen] = useState(false);

  // Modal de detalle de Laboratorio
  const [labDetailModal, setLabDetailModal] = useState<{ open: boolean; fecha: string; detalle: string }>({
    open: false,
    fecha: "",
    detalle: ""
  });

  // Estado para especialidades de interconsultas expandidas
  const [expandedInterEspecialidades, setExpandedInterEspecialidades] = useState<Set<string>>(new Set());

  // Estado para labs seleccionados para exportación PDF
  const [selectedLabsForPdf, setSelectedLabsForPdf] = useState<Set<string>>(new Set());

  // Guardado / generación
  const [saving, setSaving] = useState(false);
  const [toastOk, setToastOk] = useState<string | null>(null);
  const [toastErr, setToastErr] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Tabs: vista principal vs historial
  const [activeTab, setActiveTab] = useState<"epc" | "history">("epc");

  // ✅ Feedback de secciones generadas por IA
  type SectionRating = "ok" | "partial" | "bad" | null;
  type SectionKey = "motivo" | "evolucion" | "procedimientos" | "interconsultas" | "tratamiento" | "indicaciones" | "recomendaciones";

  const [sectionRatings, setSectionRatings] = useState<Record<SectionKey, SectionRating>>({
    motivo: null,
    evolucion: null,
    procedimientos: null,
    interconsultas: null,
    tratamiento: null,
    indicaciones: null,
    recomendaciones: null,
  });

  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    section: SectionKey | null;
    rating: SectionRating;
  }>({ open: false, section: null, rating: null });

  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Preguntas obligatorias para ratings negativos (partial/bad)
  const [feedbackQuestions, setFeedbackQuestions] = useState<{
    hasOmissions: boolean | null;    // ¿Tiene omisiones?
    hasRepetitions: boolean | null;  // ¿Tiene repeticiones/excedentes?
    isConfusing: boolean | null;     // ¿Es confuso o erróneo?
  }>({ hasOmissions: null, hasRepetitions: null, isConfusing: null });

  // ✅ Modo evaluación
  const [evaluationMode, setEvaluationMode] = useState(false);
  const [evalValidationError, setEvalValidationError] = useState<string | null>(null);

  // ✅ Evaluación previa del usuario
  const [previousEvaluation, setPreviousEvaluation] = useState<{
    has_previous: boolean;
    evaluated_at: string | null;
    evaluator_name: string | null;
  } | null>(null);
  const [loadingPreviousEval, setLoadingPreviousEval] = useState(false);

  // Mapa de nombres amigables para las secciones
  const sectionLabels: Record<SectionKey, string> = {
    motivo: "Motivo de Internación",
    evolucion: "Evolución",
    procedimientos: "Procedimientos",
    interconsultas: "Interconsultas",
    tratamiento: "Plan Terapéutico",
    indicaciones: "Indicaciones de Alta",
    recomendaciones: "Recomendaciones al Alta",
  };

  // Detectar si el paciente falleció (óbito) basado en el texto de evolución
  const pacienteFallecido = useMemo(() => {
    const texto = evolucionText.toLowerCase();
    const palabrasClave = ["óbito", "obito", "falleció", "fallecio", "murió", "murio", "defunción", "defuncion", "fallecimiento", "deceso"];
    return palabrasClave.some(palabra => texto.includes(palabra));
  }, [evolucionText]);

  // Función para detectar si un procedimiento es laboratorio
  const isLaboratorio = (texto: string): boolean => {
    const lower = texto.toLowerCase();

    // Palabras que indican claramente laboratorio (estudios de sangre/orina)
    const labKeywords = [
      // Laboratorio general
      "laboratorio", "hemograma", "glucemia", "creatinina", "uremia", "ionograma", "hepatograma",
      "coagulograma", "calcemia", "magnesio", "láctico", "lactico", "ldh", "fosfatemia",
      "ácido base", "acido base", "gasometría", "gasometria", "colesterol", "calcio",
      "triglicéridos", "trigliceridos", "uricemia", "bilirrubina", "proteínas",
      "albúmina", "albumina", "amilasa", "lipasa", "pcr", "vsg", "eritrosedimentación",
      "ferritina", "transferrina", "vitamina", "hormonas", "tsh", "t3", "t4",
      // Cultivos y estudios microbiológicos
      "hisopado", "hemocultivo", "urocultivo", "cultivo",
      // Estudios específicos
      "calcio iónico", "calcio ionico", "fósforo", "fosforo",
      "potasio", "sodio", "cloro", "bicarbonato", "urea", "ácido úrico",
      "transaminasas", "got", "gpt", "fosfatasa", "ggt", "gamma gt",
      "tiempo de protrombina", "tppa", "dimero d", "fibrinógeno"
    ];

    // Palabra que directamente indica laboratorio (match individual)
    const esLabDirecto = labKeywords.some(kw => lower.includes(kw));

    return esLabDirecto;
  };

  // Función para parsear procedimiento y extraer fecha/hora y descripción
  const parseProcedimiento = (linea: string): { fechaHora: string; descripcion: string; tieneHora: boolean } => {
    // Formato con hora: "DD/MM/YYYY HH:MM - Descripción"
    const matchConHora = linea.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})\s*-\s*(.+)$/);
    if (matchConHora) {
      return {
        fechaHora: `${matchConHora[1]} ${matchConHora[2]}`,
        descripcion: matchConHora[3],
        tieneHora: true
      };
    }

    // Formato solo fecha: "DD/MM/YYYY - Descripción"
    const matchSoloFecha = linea.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(.+)$/);
    if (matchSoloFecha) {
      return {
        fechaHora: matchSoloFecha[1],
        descripcion: matchSoloFecha[2],
        tieneHora: false
      };
    }

    return { fechaHora: "", descripcion: linea, tieneHora: false };
  };

  // Mapa de secciones API a claves internas
  const apiToSectionKey: Record<string, SectionKey> = {
    motivo_internacion: "motivo",
    evolucion: "evolucion",
    procedimientos: "procedimientos",
    interconsultas: "interconsultas",
    medicacion: "tratamiento",
    indicaciones_alta: "indicaciones",
    recomendaciones: "recomendaciones",
  };

  // Función para obtener secciones sin evaluar
  function getUnratedSections(): string[] {
    return (Object.keys(sectionRatings) as SectionKey[])
      .filter((key) => sectionRatings[key] === null)
      .map((key) => sectionLabels[key]);
  }

  // Cargar feedback previo del usuario actual
  async function loadMyPreviousFeedback() {
    if (!epc?.id) return;
    setLoadingPreviousEval(true);
    try {
      const { data } = await api.get<{
        has_previous: boolean;
        sections: Record<string, { rating: string; feedback_text: string | null; created_at: string | null }>;
        evaluated_at: string | null;
        evaluator_name: string | null;
      }>(`/epc/${epc.id}/my-feedback`);

      setPreviousEvaluation({
        has_previous: data.has_previous,
        evaluated_at: data.evaluated_at,
        evaluator_name: data.evaluator_name,
      });

      if (data.has_previous && data.sections) {
        // Rellenar sectionRatings con los valores previos
        const newRatings: Record<SectionKey, SectionRating> = {
          motivo: null,
          evolucion: null,
          procedimientos: null,
          interconsultas: null,
          tratamiento: null,
          indicaciones: null,
          recomendaciones: null,
        };

        for (const [apiSection, sectionData] of Object.entries(data.sections)) {
          const sectionKey = apiToSectionKey[apiSection];
          if (sectionKey && sectionData.rating) {
            newRatings[sectionKey] = sectionData.rating as SectionRating;
          }
        }

        setSectionRatings(newRatings);
      }
    } catch (e) {
      console.error("Error cargando evaluación previa:", e);
    } finally {
      setLoadingPreviousEval(false);
    }
  }

  // Activar modo evaluación (carga feedback previo si existe)
  async function toggleEvaluationMode() {
    if (!evaluationMode) {
      // Entrando en modo evaluación - cargar feedback previo
      setEvaluationMode(true);
      await loadMyPreviousFeedback();
    } else {
      // Saliendo del modo evaluación
      setEvaluationMode(false);
      setEvalValidationError(null);
    }
  }

  // Guardar evaluación completa
  async function saveEvaluation() {
    const unrated = getUnratedSections();
    if (unrated.length > 0) {
      setEvalValidationError(`Debes evaluar TODAS las secciones. Faltan: ${unrated.join(", ")}`);
      return;
    }
    setEvalValidationError(null);
    setToastOk("Evaluación guardada correctamente");
    setEvaluationMode(false);
  }

  // Verificar si todas las secciones están evaluadas
  const allSectionsRated = getUnratedSections().length === 0;

  // Carga de contexto
  const loadContext = async (epcIdOrPatientId: string, opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
    }
    setErrMsg(null);
    try {
      // 1) Intento traer EPC por ID; si no existe, abro por patient_id
      let epcData: EPC | null = null;
      try {
        const { data } = await api.get<EPC>(`/epc/${epcIdOrPatientId}`);
        epcData = data;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          const { data } = await api.post<EPC>(`/epc/open`, {
            patient_id: epcIdOrPatientId,
            admission_id: null,
          });
          epcData = data;
          navigate(`/epc/${data.id}`, { replace: true });
        } else {
          throw err;
        }
      }
      if (!epcData) throw new Error("EPC no encontrado/creado");

      // 2) Contexto completo (con manejo de error 404)
      let ctx: EPCContext | null = null;
      try {
        const { data } = await api.get<EPCContext>(`/epc/${epcData.id}/context`);
        ctx = data;
      } catch (ctxErr: any) {
        // Si falla el context, usar datos básicos del EPC
        console.warn("[ViewEdit] Context fetch failed, using basic EPC data:", ctxErr?.response?.status);
        ctx = {
          epc: epcData,
          patient: undefined,
          admission: undefined,
          demographics: undefined,
          doctors: [],
          generated: (epcData as any).generated ?? null,
          history: [],
          hce: undefined
        } as unknown as EPCContext;
      }

      setEpc(ctx.epc);
      setPatient(ctx.patient || null);
      setAdmission(ctx.admission || null);
      setDemographics(ctx.demographics || null);
      setDoctors(ctx.doctors || []);
      setGenerated(ctx.generated || null);
      setHistory(ctx.history || []);

      // Reset de flags de edición
      setEditingMotivo(false);
      setEditingEvolucion(false);
      setEditingProc(false);
      setEditingInter(false);
      setEditingTrat(false);
      setEditingIndAlta(false);
      setEditingRecom(false);

      // Contexto clínico
      const clinical: any = (ctx as any).clinical || {};
      const structured: any = ctx.hce?.structured || {};

      // Form defaults
      setTitulo((ctx.epc.titulo || "Epicrisis de internación").trim());
      setCie10(
        (
          ctx.epc.diagnostico_principal_cie10 ||
          ctx.generated?.data?.diagnostico_principal_cie10 ||
          ""
        ).toString()
      );
      setFechaEmision(isoToYmd(ctx.epc.fecha_emision) || ymdToday());
      setFirmado(Boolean(ctx.epc.firmado_por_medico));

      // Médico: si el EPC ya tiene nombre, lo respetamos
      const currentMedName = (ctx.epc.medico_responsable || "").trim();
      if (currentMedName) {
        setMedicoNombre(currentMedName);
        const found = (ctx.doctors || []).find((d) => d.full_name === currentMedName);
        setMedicoId(found?.id || "");
      } else {
        setMedicoNombre("");
        setMedicoId("");
      }

      // Datos clínicos con múltiples fuentes
      const admiNumRaw =
        clinical.admision_num ??
        ctx.admission?.admision_num ??
        (ctx.epc as any).admision_num ??
        structured.admision_num ??
        structured.admision ??
        structured.numero_admision ??
        "";

      const protocoloRaw =
        clinical.protocolo ??
        ctx.admission?.protocolo ??
        (ctx.epc as any).protocolo ??
        structured.protocolo ??
        structured.protocolo_num ??
        "";

      const fechaIngRaw =
        clinical.fecha_ingreso ??
        ctx.admission?.fecha_ingreso ??
        (ctx.epc as any).fecha_ingreso ??
        structured.fecha_ingreso ??
        structured.fecha_admision ??
        "";

      const fechaEgrRaw =
        clinical.fecha_egreso ??
        ctx.admission?.fecha_egreso ??
        (ctx.epc as any).fecha_egreso ??
        structured.fecha_egreso ??
        structured.fecha_alta ??
        "";

      const sectorRaw =
        clinical.sector ??
        ctx.admission?.sector ??
        (ctx.epc as any).sector ??
        structured.sector ??
        structured.servicio ??
        structured.unidad ??
        "";

      const habRaw =
        clinical.habitacion ??
        ctx.admission?.habitacion ??
        (ctx.epc as any).habitacion ??
        structured.habitacion ??
        structured.hab ??
        "";

      const camaRaw =
        clinical.cama ??
        ctx.admission?.cama ??
        (ctx.epc as any).cama ??
        structured.cama ??
        structured.cama_num ??
        "";

      const nroHCRaw =
        clinical.numero_historia_clinica ??
        (ctx.epc as any).numero_historia_clinica ??
        structured.numero_historia_clinica ??
        structured.nro_hc ??
        structured.historia_clinica ??
        "";

      setAdmNum(admiNumRaw || "");
      setProtocolo(protocoloRaw || "");
      setFecIng(anyToYmd(fechaIngRaw) || "");
      setFecEgr(anyToYmd(fechaEgrRaw) || ymdToday());
      setSector(sectorRaw || "");
      setHab(habRaw || "");
      setCama(camaRaw || "");
      setNroHC(nroHCRaw || "");

      // ==================== CAMPOS GENERADOS EDITABLES ====================
      const rawGen: any = ctx.generated || null;
      const g: any =
        (rawGen && rawGen.data && typeof rawGen.data === "object" ? rawGen.data : rawGen) ||
        null;

      setMotivoText(g?.motivo_internacion || "");
      setEvolucionText(g?.evolucion || "");
      setProcedimientosText(arrToMultiline(g?.procedimientos));
      setInterconsultasText(arrToMultiline(g?.interconsultas));
      setTratamientoText(arrToMultiline(g?.medicacion));

      // Guardar datos estructurados de medicación para renderizado separado
      // PRIORIDAD: usar nuevos campos separados si existen, sino usar legacy
      const medInternacion = Array.isArray(g?.medicacion_internacion) ? g.medicacion_internacion : [];
      const medPrevia = Array.isArray(g?.medicacion_previa) ? g.medicacion_previa : [];
      const medLegacy = Array.isArray(g?.medicacion) ? g.medicacion : [];

      // Si hay medicación en los nuevos campos, usarlos
      if (medInternacion.length > 0 || medPrevia.length > 0) {
        const allMeds = [...medInternacion, ...medPrevia].filter((m: any) => m && m.farmaco);
        setMedicacionData(allMeds);
      } else if (medLegacy.length > 0) {
        // Fallback a legacy para EPCs antiguas
        setMedicacionData(medLegacy.filter((m: any) => m && m.farmaco));
      } else {
        setMedicacionData([]);
      }

      setIndicacionesAltaText(arrToMultiline(g?.indicaciones_alta));
      setRecomendacionesText(arrToMultiline(g?.recomendaciones));
      // ====================================================================
    } catch (e: any) {
      setErrMsg(e?.response?.data?.detail || "No se pudo cargar la Epicrisis.");
    } finally {
      if (!opts?.silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!id) return;
    loadContext(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const estadoTagCls = useMemo(() => `tag ${epc?.estado ?? "borrador"}`, [epc?.estado]);

  async function onSave() {
    if (!epc) return;
    setSaving(true);
    setToastOk(null);
    setToastErr(null);
    try {
      // armamos data generada editada
      const baseGenData: any =
        generated && generated.data && typeof generated.data === "object"
          ? generated.data
          : {};

      const updatedGeneratedData: any = {
        ...baseGenData,
        motivo_internacion: motivoText.trim(),
        evolucion: evolucionText.trim(),
        procedimientos: multilineToArray(procedimientosText),
        interconsultas: multilineToArray(interconsultasText),
        medicacion: multilineToArray(tratamientoText),
        indicaciones_alta: multilineToArray(indicacionesAltaText),
        recomendaciones: multilineToArray(recomendacionesText),
      };

      const payload: Record<string, any> = {
        titulo,
        diagnostico_principal_cie10: cie10 || null,
        fecha_emision: fechaEmision || null,
        firmado_por_medico: firmado,
        medico_responsable: medicoNombre || null,
        estado: "validada",
      };

      if (generated) {
        payload.generated = {
          ...generated,
          data: updatedGeneratedData,
        };
      }

      await api.patch(`/epc/${epc.id}`, payload);
      setToastOk("Cambios guardados correctamente.");
      navigate("/patients");
    } catch (e: any) {
      setToastErr(e?.response?.data?.detail ?? "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function onGenerate() {
    if (!epc) return;
    if (generating) return;
    setToastOk(null);
    setToastErr(null);
    setGenerating(true);
    try {
      await api.post(`/epc/${epc.id}/generate`);
      await loadContext(epc.id, { silent: true });
      setToastOk("Contenido generado correctamente.");
    } catch (e: any) {
      setToastErr(e?.response?.data?.detail ?? "No se pudo generar.");
    } finally {
      setGenerating(false);
    }
  }

  // =========================
  // ✅ PRINT / DOWNLOAD (FIX)
  // =========================
  async function fetchEpcPdfBlob(epcId: string): Promise<Blob> {
    const token = getAuthTokenFromStorage();
    const bearer = toBearer(token);

    if (!bearer) {
      throw new Error("Not authenticated");
    }

    const res = await api.get(`/epc/${epcId}/print`, {
      responseType: "blob",
      headers: {
        Authorization: bearer,
        Accept: "application/pdf",
      },
    });

    return new Blob([res.data], { type: "application/pdf" });
  }

  async function onPrint(epcId: string) {
    setToastOk(null);
    setToastErr(null);
    try {
      const blob = await fetchEpcPdfBlob(epcId);
      openBlobInNewTab(blob);
    } catch (e: any) {
      setToastErr(e?.response?.data?.detail ?? e?.message ?? "No se pudo imprimir.");
    }
  }

  async function onDownloadPdf(epcId: string) {
    setToastOk(null);
    setToastErr(null);
    try {
      const blob = await fetchEpcPdfBlob(epcId);
      downloadBlob(blob, `epicrisis_${epcId}.pdf`);
    } catch (e: any) {
      setToastErr(e?.response?.data?.detail ?? e?.message ?? "No se pudo descargar.");
    }
  }

  // Guardar selección de labs para exportación PDF
  async function saveLabSelectionToEpc() {
    if (!epc?.id) return;

    setSaving(true);
    try {
      const exportConfig = {
        selected_labs: Array.from(selectedLabsForPdf),
        timestamp: new Date().toISOString()
      };

      // Actualizar EPC con la configuración de exportación
      await api.patch(`/epc/${epc.id}`, {
        export_config: exportConfig
      });

      setToastOk("✅ Selección guardada para exportación PDF");
      setLabDetailModal({ open: false, fecha: "", detalle: "" });
    } catch (err: any) {
      setToastErr(err?.response?.data?.detail ?? err?.message ?? "Error al guardar selección");
    } finally {
      setSaving(false);
    }
  }
  // =========================

  function onDoctorChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setMedicoId(val);
    const doc = doctors.find((d) => d.id === val);
    setMedicoNombre(doc ? doc.full_name : "");
  }

  function copyGenerated() {
    const json = JSON.stringify(
      {
        ...((generated && generated.data) || {}),
        motivo_internacion: motivoText,
        evolucion: evolucionText,
        procedimientos: multilineToArray(procedimientosText),
        interconsultas: multilineToArray(interconsultasText),
        medicacion: multilineToArray(tratamientoText),
        indicaciones_alta: multilineToArray(indicacionesAltaText),
        recomendaciones: multilineToArray(recomendacionesText),
      },
      null,
      2
    );
    navigator.clipboard.writeText(json);
    setToastOk("Contenido copiado.");
  }

  function downloadGenerated() {
    const json = JSON.stringify(
      {
        epc_id: epc?.id,
        generated_at: generated?.at,
        model: generated?.model,
        provider: generated?.provider,
        data: {
          ...((generated && generated.data) || {}),
          motivo_internacion: motivoText,
          evolucion: evolucionText,
          procedimientos: multilineToArray(procedimientosText),
          interconsultas: multilineToArray(interconsultasText),
          medicacion: multilineToArray(tratamientoText),
          indicaciones_alta: multilineToArray(indicacionesAltaText),
          recomendaciones: multilineToArray(recomendacionesText),
        },
      },
      null,
      2
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `epc_${epc?.id}_generated.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ✅ Funciones de feedback de secciones
  const sectionApiMap: Record<string, { apiName: string; getContent: () => string }> = {
    motivo: { apiName: "motivo_internacion", getContent: () => motivoText },
    evolucion: { apiName: "evolucion", getContent: () => evolucionText },
    procedimientos: { apiName: "procedimientos", getContent: () => procedimientosText },
    interconsultas: { apiName: "interconsultas", getContent: () => interconsultasText },
    tratamiento: { apiName: "medicacion", getContent: () => tratamientoText },
    indicaciones: { apiName: "indicaciones_alta", getContent: () => indicacionesAltaText },
    recomendaciones: { apiName: "recomendaciones", getContent: () => recomendacionesText },
  };

  async function submitFeedbackToApi(
    section: string,
    rating: string,
    text: string,
    questions?: { hasOmissions: boolean | null; hasRepetitions: boolean | null; isConfusing: boolean | null }
  ) {
    if (!epc) return;
    try {
      await api.post(`/epc/${epc.id}/feedback`, {
        section: sectionApiMap[section]?.apiName || section,
        rating,
        feedback_text: text || null,
        original_content: sectionApiMap[section]?.getContent() || "",
        // Preguntas obligatorias para ratings negativos
        has_omissions: questions?.hasOmissions ?? null,
        has_repetitions: questions?.hasRepetitions ?? null,
        is_confusing: questions?.isConfusing ?? null,
      });
    } catch (e) {
      console.error("Error enviando feedback:", e);
    }
  }

  function handleRating(section: string, rating: "ok" | "partial" | "bad") {
    if (rating === "ok") {
      // Guardar directamente sin modal
      submitFeedbackToApi(section, rating, "");
      setSectionRatings((prev) => ({ ...prev, [section]: rating }));
    } else {
      // Abrir modal obligatorio con preguntas
      setFeedbackModal({ open: true, section: section as any, rating });
      setFeedbackText("");
      setFeedbackQuestions({ hasOmissions: null, hasRepetitions: null, isConfusing: null });
    }
  }

  // Validación: todas las preguntas deben estar respondidas
  const allQuestionsAnswered =
    feedbackQuestions.hasOmissions !== null &&
    feedbackQuestions.hasRepetitions !== null &&
    feedbackQuestions.isConfusing !== null;

  // Validación: texto mínimo 30 caracteres
  const MIN_FEEDBACK_LENGTH = 30;
  const feedbackTextValid = feedbackText.trim().length >= MIN_FEEDBACK_LENGTH;

  function confirmFeedback() {
    if (!feedbackModal.section || !feedbackTextValid || !allQuestionsAnswered) return;

    setSubmittingFeedback(true);
    submitFeedbackToApi(
      feedbackModal.section,
      feedbackModal.rating || "partial",
      feedbackText,
      feedbackQuestions
    )
      .then(() => {
        setSectionRatings((prev) => ({ ...prev, [feedbackModal.section!]: feedbackModal.rating }));
        setFeedbackModal({ open: false, section: null, rating: null });
        setFeedbackText("");
        setFeedbackQuestions({ hasOmissions: null, hasRepetitions: null, isConfusing: null });
        setToastOk("Feedback enviado correctamente");
      })
      .finally(() => setSubmittingFeedback(false));
  }

  function cancelFeedback() {
    setFeedbackModal({ open: false, section: null, rating: null });
    setFeedbackText("");
    setFeedbackQuestions({ hasOmissions: null, hasRepetitions: null, isConfusing: null });
  }

  // Componente reutilizable para feedback buttons (solo visible en modo evaluación)
  function FeedbackButtons({ section }: { section: string }) {
    if (!evaluationMode) return null;

    return (
      <div className="feedback-icons">
        <button
          type="button"
          className={`fb-btn ok ${sectionRatings[section as keyof typeof sectionRatings] === "ok" ? "active" : ""}`}
          title="OK - Correcto"
          onClick={() => handleRating(section, "ok")}
        >
          <FaThumbsUp />
        </button>
        <button
          type="button"
          className={`fb-btn partial ${sectionRatings[section as keyof typeof sectionRatings] === "partial" ? "active" : ""}`}
          title="A medias - Funciona parcialmente"
          onClick={() => handleRating(section, "partial")}
        >
          <FaMeh />
        </button>
        <button
          type="button"
          className={`fb-btn bad ${sectionRatings[section as keyof typeof sectionRatings] === "bad" ? "active" : ""}`}
          title="Mal - Sección incorrecta"
          onClick={() => handleRating(section, "bad")}
        >
          <FaThumbsDown />
        </button>
      </div>
    );
  }

  if (loading) return <div className="epc-wrap">Cargando Epicrisis…</div>;
  if (errMsg)
    return (
      <div className="epc-wrap">
        <div className="toast err">{errMsg}</div>
      </div>
    );
  if (!epc) return null;

  const nombrePaciente = fullName(patient);
  const sexoEdad = [
    (demographics?.sexo || patient?.sexo || "") &&
    `Sexo: ${demographics?.sexo || patient?.sexo}`,
    demographics?.edad != null && `Edad: ${demographics?.edad}`,
  ]
    .filter(Boolean)
    .join(" • ");

  const medicoDisplay = medicoNombre || epc.medico_responsable || "";

  return (
    <div className="epc-wrap">
      {/* Encabezado */}
      <div className="card card-header">
        <div className="row header-main">
          <div className="row header-left">
            <button className="btn ghost" onClick={() => navigate(-1)} title="Volver">
              <FaArrowLeft /> Volver
            </button>
            <div className="title">
              <FaFileMedical /> Epicrisis
            </div>
            <span className={estadoTagCls}>{epc.estado}</span>
          </div>
          <div className="meta header-right">
            <span>
              <b>ID EPC:</b> {epc.id}
            </span>
          </div>
        </div>
        <div className="hr" />
        <div className="meta meta-patient">
          <div>
            <b>Paciente:</b> {nombrePaciente || epc.patient_id}
          </div>
          {sexoEdad && (
            <div className="chip">
              <b>{sexoEdad}</b>
            </div>
          )}
          {patient?.obra_social && (
            <div>
              <b>OS:</b> {patient.obra_social}
            </div>
          )}
          {patient?.nro_beneficiario && (
            <div>
              <b>N° Benef.:</b> {patient.nro_beneficiario}
            </div>
          )}
        </div>

        {/* HISTORIAL / QUIÉN LA CONSTRUYÓ */}
        <div className="meta meta-history">
          <div>
            <b>Construida / validada por:</b> {medicoDisplay || "—"}
            {fechaEmision && ` · ${fechaEmision}`}
            {firmado && " · Firmada"}
          </div>
          <div>
            <b>Generada por IA:</b> {generated?.provider || "—"}
            {generated?.model && ` · ${generated.model}`}
            {generated?.at && ` · ${formatHistoryDate(generated.at)}`}
          </div>
          {history.length > 0 && (
            <div className="history-list">
              {history.slice(0, 3).map((h, idx) => (
                <div key={idx} className="history-item">
                  <span className="history-dot" />
                  <span className="history-text">
                    <b>{h.action}</b>
                    {h.by && ` · ${h.by}`}
                    {h.at && ` · ${formatHistoryDate(h.at)}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pestañas */}
      <div className="tabs">
        <button
          type="button"
          className={`tab ${activeTab === "epc" ? "active" : ""}`}
          onClick={() => setActiveTab("epc")}
        >
          Epicrisis
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Historial
        </button>
      </div>

      {/* Contenido según pestaña */}
      {activeTab === "epc" && (
        <div className="epc-layout">
          {/* Columna izquierda: Card 1 (form básico) + Card 3 (motivo/evolución) */}
          <div className="epc-column">
            {/* CARD 1 - Datos de la epicrisis / acciones */}
            <div className="card card-epc-main">
              <div className="section-header">
                <h3>Datos de la epicrisis</h3>
              </div>
              <div className="grid2">
                <div className="field">
                  <label className="label">Título</label>
                  <input
                    className="input"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Epicrisis de internación"
                  />
                </div>

                <div className="field">
                  <label className="label">Médico responsable</label>
                  <div className="row" style={{ gap: 8 }}>
                    <FaUserMd style={{ opacity: 0.7 }} />
                    <select className="select" value={medicoId} onChange={onDoctorChange}>
                      <option value="">
                        {doctors.length ? "— seleccionar —" : "— sin médicos cargados —"}
                      </option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Si querés CIE-10, descomentá */}
                {/* <div className="field">
                  <label className="label">Diagnóstico principal (CIE-10)</label>
                  <input
                    className="input"
                    placeholder="Ej.: S52.3"
                    value={cie10}
                    onChange={(e) => setCie10(e.target.value.toUpperCase())}
                  />
                </div> */}

                <div className="field">
                  <label className="label">Fecha de emisión</label>
                  <input
                    type="date"
                    className="date"
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                  />
                </div>
              </div>

              <div className="hr" />

              <div className="row" style={{ gap: 12 }}>
                <label className="row" style={{ gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={firmado}
                    onChange={(e) => setFirmado(e.target.checked)}
                  />
                  <span>Firmado por médico</span>
                  {firmado && <FaCheck style={{ color: "#7bf0b7" }} />}
                </label>
              </div>

              <div className="toolbar">
                <button className="btn" onClick={onGenerate} disabled={generating}>
                  <FaClipboard /> {generating ? "Generando…" : "Generar / Regenerar"}
                </button>

                <button
                  className={`btn primary ${evaluationMode ? "disabled" : ""}`}
                  onClick={onSave}
                  disabled={saving || evaluationMode}
                  title={evaluationMode ? "Primero guarde la evaluación" : "Guardar cambios de la EPC"}
                >
                  <FaSave />
                  {saving ? "Guardando…" : "Guardar"}
                </button>

                {/* Botón Evaluar / Cancelar Evaluación */}
                {!evaluationMode ? (
                  <button
                    className="btn eval-btn"
                    onClick={toggleEvaluationMode}
                  >
                    <FaClipboardCheck /> Evaluar
                  </button>
                ) : (
                  <button
                    className="btn eval-btn cancel"
                    onClick={() => {
                      setEvaluationMode(false);
                      setEvalValidationError(null);
                    }}
                  >
                    <FaTimes /> Cancelar Evaluación
                  </button>
                )}

                {/* Botón Guardar Evaluación (solo visible en modo evaluación) */}
                {evaluationMode && (
                  <button
                    className={`btn primary eval-save-btn ${!allSectionsRated ? "disabled" : ""}`}
                    onClick={saveEvaluation}
                    disabled={!allSectionsRated}
                    title={!allSectionsRated ? `Faltan evaluar: ${getUnratedSections().join(", ")}` : "Guardar evaluación completa"}
                  >
                    <FaCheck /> Guardar Evaluación ({7 - getUnratedSections().length}/7)
                  </button>
                )}

                {/* Indicador de evaluación previa */}
                {evaluationMode && previousEvaluation?.has_previous && (
                  <div className="eval-previous-info">
                    ✅ Evaluado anteriormente el {new Date(previousEvaluation.evaluated_at!).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}

                {/* Indicador de carga de evaluación previa */}
                {evaluationMode && loadingPreviousEval && (
                  <div className="eval-loading">Cargando evaluación previa...</div>
                )}

                {/* ✅ Descargar e Imprimir juntos, lado a lado */}
                <button className="btn" onClick={() => onDownloadPdf(epc.id)}>
                  <FaDownload /> Descargar PDF
                </button>

                <button className="btn" onClick={() => onPrint(epc.id)}>
                  <FaPrint /> Imprimir
                </button>
              </div>

              {/* Mensaje de error de validación de evaluación */}
              {evalValidationError && (
                <div className="toast err eval-error">
                  <strong>⚠️ Evaluación incompleta:</strong> {evalValidationError}
                </div>
              )}

              {toastOk && <div className="toast ok">{toastOk}</div>}
              {toastErr && <div className="toast err">{toastErr}</div>}
            </div>

            {/* CARD 3 - Motivo de internación / Evolución */}
            <div className="card card-gen card-motivo-evol">
              <div className="section-header">
                <h3>Contenido generado por IA</h3>
                <div className="section-actions">
                  <button className="btn ghost" onClick={copyGenerated}>
                    <FaCopy /> Copiar
                  </button>
                  <button className="btn ghost" onClick={downloadGenerated}>
                    <FaDownload /> Descargar
                  </button>
                </div>
              </div>

              <div className="meta meta-gen">
                <span>
                  <b>Generado:</b> {generated?.at ? formatHistoryDate(generated.at) : "—"}
                </span>
                <span>
                  <b>HCE origen:</b> {generated?.hce_source_id || "—"}
                </span>

              </div>

              {generating && (
                <div className="brain-progress">
                  <div className="brain-icon">
                    <FaBrain />
                  </div>
                  <div className="brain-bar">
                    <div className="brain-bar-inner" />
                  </div>
                  <div className="brain-text">Generando contenido con IA…</div>
                </div>
              )}

              <div className="gen-block">
                <div className="gen-header-row">
                  <div className="gen-key">Motivo internación</div>
                  <div className="gen-header-actions">
                    <FeedbackButtons section="motivo" />
                    {!editingMotivo && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="Editar sección"
                        onClick={() => setEditingMotivo(true)}
                      >
                        <FaPen />
                      </button>
                    )}
                    {editingMotivo && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="Confirmar edición de sección"
                        onClick={() => setEditingMotivo(false)}
                      >
                        <FaSave />
                      </button>
                    )}
                  </div>
                </div>
                {editingMotivo ? (
                  <textarea
                    className="gen-textarea"
                    value={motivoText}
                    onChange={(e) => setMotivoText(e.target.value)}
                  />
                ) : (
                  <div className="gen-text-readonly">{motivoText.trim() || "—"}</div>
                )}
              </div>

              <div className="gen-block">
                <div className="gen-header-row">
                  <div className="gen-key">Evolución</div>
                  <div className="gen-header-actions">
                    <FeedbackButtons section="evolucion" />
                    {!editingEvolucion && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="Editar sección"
                        onClick={() => setEditingEvolucion(true)}
                      >
                        <FaPen />
                      </button>
                    )}
                    {editingEvolucion && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="Confirmar edición de sección"
                        onClick={() => setEditingEvolucion(false)}
                      >
                        <FaSave />
                      </button>
                    )}
                  </div>
                </div>
                {editingEvolucion ? (
                  <textarea
                    className="gen-textarea long"
                    value={evolucionText}
                    onChange={(e) => setEvolucionText(e.target.value)}
                  />
                ) : (
                  <div className="gen-text-readonly evolucion-content">
                    {(() => {
                      const texto = evolucionText.trim();
                      if (!texto) return "—";

                      // Si paciente falleció, formatear el párrafo del óbito
                      if (pacienteFallecido) {
                        const parrafos = texto.split(/\n\n/);
                        const palabrasObito = ["paciente obitó", "óbito", "obito", "falleció", "fallecio", "murió", "murio", "defunción", "defuncion", "fallecimiento", "deceso"];

                        // Buscar párrafo que mencione el fallecimiento
                        const idxObito = parrafos.findIndex(p =>
                          palabrasObito.some(palabra => p.toLowerCase().includes(palabra))
                        );

                        if (idxObito !== -1) {
                          const parrafoObito = parrafos[idxObito];

                          // Verificar si ya tiene el formato "PACIENTE OBITÓ - Fecha:"
                          const yaFormateado = parrafoObito.toLowerCase().includes("paciente obitó");

                          // Extraer fecha y hora del texto
                          const fechaMatch = parrafoObito.match(/Fecha:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i) ||
                            parrafoObito.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
                          const horaMatch = parrafoObito.match(/Hora:\s*(\d{1,2}:\d{2})/i) ||
                            parrafoObito.match(/(\d{1,2}:\d{2})/);

                          const fechaObito = fechaMatch ? fechaMatch[1] : "";
                          const horaObito = horaMatch ? horaMatch[1] : "";

                          // Limpiar el texto si ya tiene formato
                          let textoLimpio = parrafoObito;
                          if (yaFormateado) {
                            textoLimpio = parrafoObito.replace(/PACIENTE OBITÓ\s*-\s*Fecha:\s*[\d\/]+\s*(Hora:\s*[\d:]+)?\s*\.?\s*/i, "").trim();
                          }

                          return (
                            <>
                              {/* Párrafos antes del óbito */}
                              {parrafos.slice(0, idxObito).map((p, i) => (
                                <p key={i}>{p}</p>
                              ))}

                              {/* Párrafo del óbito con encabezado */}
                              <div className="obito-section">
                                <div className="obito-header">
                                  ⚫ PACIENTE OBITÓ - Fecha: {fechaObito || "no registrada"} {horaObito ? `Hora: ${horaObito}` : ""}
                                </div>
                                <p>{textoLimpio || parrafoObito}</p>
                              </div>

                              {/* Párrafos después del óbito (si hay) */}
                              {parrafos.slice(idxObito + 1).map((p, i) => (
                                <p key={i + idxObito + 1}>{p}</p>
                              ))}
                            </>
                          );
                        }
                      }

                      // Sin óbito: renderizado normal
                      return texto;
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha: Card 2 (datos clínicos) + Card 4 (resto del contenido generado) */}
          <div className="epc-column">
            {/* CARD 2 - Datos clínicos */}
            <div className="card card-clinical">
              <div className="section-header">
                <h3>Datos clínicos</h3>
              </div>
              <div className="grid2" style={{ marginTop: 10 }}>
                <div className="field">
                  <label className="label">N° Historia Clínica</label>
                  <input
                    className="input"
                    placeholder="ej. 123456"
                    value={nroHC}
                    onChange={(e) => setNroHC(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label">N° Admisión</label>
                  <input
                    className="input"
                    placeholder="ej. 653476-1"
                    value={admNum}
                    onChange={(e) => setAdmNum(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label">Protocolo</label>
                  <input
                    className="input"
                    placeholder="ej. 6534761-001"
                    value={protocolo}
                    onChange={(e) => setProtocolo(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label">Fecha de ingreso</label>
                  <input
                    type="date"
                    className="date"
                    value={fecIng}
                    onChange={(e) => setFecIng(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label">Fecha de egreso</label>
                  <input
                    type="date"
                    className="date"
                    value={fecEgr}
                    onChange={(e) => setFecEgr(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label">Sector</label>
                  <input
                    className="input"
                    placeholder="EMERGENCIAS - INTERNACION"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label">Hab.</label>
                  <input
                    className="input"
                    placeholder="033"
                    value={hab}
                    onChange={(e) => setHab(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label">Cama</label>
                  <input
                    className="input"
                    placeholder="01"
                    value={cama}
                    onChange={(e) => setCama(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* CARD 4 - Procedimientos / Interconsultas / Tratamiento / Indicaciones / Recomendaciones */}
            <div className="card card-gen card-terapeutica">
              <div className="section-header">
                <h3>Procedimientos y plan terapéutico</h3>
              </div>

              {/* Procedimientos */}
              <div className="gen-block">
                <div className="gen-header-row">
                  <div className="gen-key">Procedimientos</div>
                  <div className="gen-header-actions">
                    <FeedbackButtons section="procedimientos" />
                    {!editingProc && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="Editar sección"
                        onClick={() => setEditingProc(true)}
                      >
                        <FaPen />
                      </button>
                    )}
                    {editingProc && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="Confirmar edición de sección"
                        onClick={() => setEditingProc(false)}
                      >
                        <FaSave />
                      </button>
                    )}
                  </div>
                </div>
                {editingProc ? (
                  <textarea
                    className="gen-textarea"
                    value={procedimientosText}
                    onChange={(e) => setProcedimientosText(e.target.value)}
                  />
                ) : (
                  <div className="gen-text-readonly procedimientos-list">
                    {(() => {
                      const lineas = procedimientosText.trim() ? procedimientosText.split(/\r?\n/).filter(t => t.trim()) : [];
                      if (!lineas.length) return "—";

                      // Parsear todas las líneas
                      const parsed = lineas.map(t => {
                        const { fechaHora, descripcion, tieneHora } = parseProcedimiento(t);
                        const esLab = isLaboratorio(t);
                        return { original: t, fechaHora, descripcion, tieneHora, esLab };
                      });

                      // Función auxiliar para convertir hora a minutos
                      const horaAMinutos = (hora: string): number => {
                        const match = hora.match(/(\d{1,2}):(\d{2})/);
                        if (!match) return -1;
                        return parseInt(match[1]) * 60 + parseInt(match[2]);
                      };

                      // Función para obtener clave de agrupación (fecha + bloque de hora)
                      const getClaveAgrupacion = (fechaHora: string, tieneHora: boolean): string => {
                        if (!tieneHora) {
                          // Sin hora: agrupar por fecha
                          return `${fechaHora}|SIN_HORA`;
                        }
                        // Con hora: extraer fecha y hora
                        const partes = fechaHora.split(' ');
                        const fecha = partes[0];
                        const hora = partes[1] || "";
                        const minutos = horaAMinutos(hora);
                        // Crear bloque de 3 minutos (0-2, 3-5, 6-8, etc.)
                        const bloqueMinutos = Math.floor(minutos / 3) * 3;
                        return `${fecha}|${bloqueMinutos}`;
                      };

                      // Agrupar TODOS los laboratorios en un solo item
                      const todosLosLabs: string[] = [];
                      const otrosItems: typeof parsed = [];

                      parsed.forEach(item => {
                        if (item.esLab && item.fechaHora) {
                          todosLosLabs.push(`${item.fechaHora}: ${item.descripcion}`);
                        } else {
                          otrosItems.push(item);
                        }
                      });

                      // Renderizar items agrupados y no agrupados
                      const elementos: JSX.Element[] = [];
                      let keyIdx = 0;

                      // Laboratorios: 1 solo item agrupado sin fecha
                      if (todosLosLabs.length > 0) {
                        const detalleCompleto = todosLosLabs.join("\n");
                        elementos.push(
                          <div key={`lab-${keyIdx++}`} className="proc-item proc-lab">
                            • <button
                              type="button"
                              className="lab-tag"
                              onClick={() => setLabDetailModal({
                                open: true,
                                fecha: "Durante la internación",
                                detalle: detalleCompleto
                              })}
                            >
                              Laboratorios realizados ({todosLosLabs.length} {todosLosLabs.length === 1 ? 'estudio' : 'estudios'})
                            </button>
                          </div>
                        );
                      }

                      // Otros items (procedimientos normales)
                      otrosItems.forEach((item) => {
                        const fechaFormateada = item.fechaHora
                          ? (item.tieneHora ? item.fechaHora : `${item.fechaHora} (hora no registrada)`)
                          : "";

                        if (item.fechaHora && !item.tieneHora) {
                          elementos.push(<div key={`proc-${keyIdx++}`}>• {fechaFormateada} - {item.descripcion}</div>);
                        } else {
                          elementos.push(<div key={`proc-${keyIdx++}`}>• {item.original}</div>);
                        }
                      });

                      return elementos;
                    })()}
                  </div>
                )}
              </div>

              {/* Interconsultas */}
              <div className="gen-block">
                <div className="gen-header-row">
                  <div className="gen-key">Interconsultas</div>
                  <div className="gen-header-actions">
                    <FeedbackButtons section="interconsultas" />
                    {!editingInter && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="Editar sección"
                        onClick={() => setEditingInter(true)}
                      >
                        <FaPen />
                      </button>
                    )}
                    {editingInter && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="Confirmar edición de sección"
                        onClick={() => setEditingInter(false)}
                      >
                        <FaSave />
                      </button>
                    )}
                  </div>
                </div>
                {editingInter ? (
                  <textarea
                    className="gen-textarea"
                    value={interconsultasText}
                    onChange={(e) => setInterconsultasText(e.target.value)}
                  />
                ) : (
                  <div className="gen-text-readonly interconsultas-grouped">
                    {(() => {
                      const lineas = interconsultasText.trim()
                        ? interconsultasText.split(/\r?\n/).filter(t => t.trim())
                        : [];

                      if (!lineas.length) return "—";

                      // Estructura: líneas que empiezan con "•" o sin guión son headers
                      // líneas que empiezan con "-" o "  -" son detalles del header anterior
                      type InterconsultaGrupo = {
                        header: string;
                        detalles: string[];
                        key: string;
                      };

                      const grupos: InterconsultaGrupo[] = [];
                      let currentGrupo: InterconsultaGrupo | null = null;

                      lineas.forEach((linea, idx) => {
                        const trimmed = linea.trim();

                        // Detectar si es un detalle (empieza con "-" o "•-")
                        const esDetalle = trimmed.startsWith("-") ||
                          trimmed.startsWith("•-") ||
                          trimmed.startsWith("• -") ||
                          (linea.startsWith("  ") && !trimmed.startsWith("•"));

                        if (esDetalle && currentGrupo) {
                          // Es un detalle, agregarlo al grupo actual
                          // Limpiar el guión inicial
                          let detalleTexto = trimmed.replace(/^[•\s]*-\s*/, "").trim();
                          currentGrupo.detalles.push(detalleTexto);
                        } else {
                          // Es un nuevo header (línea principal)
                          // Limpiar el bullet point si existe
                          let headerTexto = trimmed.replace(/^•\s*/, "").trim();

                          currentGrupo = {
                            header: headerTexto,
                            detalles: [],
                            key: `inter-${idx}`
                          };
                          grupos.push(currentGrupo);
                        }
                      });

                      // Si no hay grupos estructurados, mostrar como lista simple
                      if (grupos.length === 0) {
                        return lineas.map((t, i) => <div key={i}>• {t}</div>);
                      }

                      const toggleGrupo = (key: string) => {
                        setExpandedInterEspecialidades(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(key)) {
                            newSet.delete(key);
                          } else {
                            newSet.add(key);
                          }
                          return newSet;
                        });
                      };

                      return (
                        <div className="inter-tags-container">
                          {grupos.map(grupo => {
                            const isExpanded = expandedInterEspecialidades.has(grupo.key);
                            const tieneDetalles = grupo.detalles.length > 0;

                            return (
                              <div key={grupo.key} className="inter-especialidad-group">
                                {tieneDetalles ? (
                                  <button
                                    type="button"
                                    className={`inter-tag ${isExpanded ? 'expanded' : ''}`}
                                    onClick={() => toggleGrupo(grupo.key)}
                                  >
                                    <span className="inter-tag-name">{grupo.header}</span>
                                    <span className="inter-tag-chevron">{isExpanded ? '▼' : '▶'}</span>
                                  </button>
                                ) : (
                                  <div className="inter-tag inter-tag-simple">
                                    <span className="inter-tag-name">{grupo.header}</span>
                                  </div>
                                )}

                                {isExpanded && tieneDetalles && (
                                  <div className="inter-detalles">
                                    {grupo.detalles.map((detalle, idx) => (
                                      <div key={idx} className="inter-detalle-item">
                                        <span className="inter-texto">{detalle}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Tratamiento terapéutico */}
              <div className="gen-block">
                <div className="gen-header-row">
                  <div className="gen-key">Plan Terapéutico <span className="section-tag">En Internación</span></div>
                  <div className="gen-header-actions">
                    <FeedbackButtons section="tratamiento" />
                    {!editingTrat && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="Editar sección"
                        onClick={() => setEditingTrat(true)}
                      >
                        <FaPen />
                      </button>
                    )}
                    {editingTrat && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="Confirmar edición de sección"
                        onClick={() => setEditingTrat(false)}
                      >
                        <FaSave />
                      </button>
                    )}
                  </div>
                </div>
                {editingTrat ? (
                  <textarea
                    className="gen-textarea"
                    value={tratamientoText}
                    onChange={(e) => setTratamientoText(e.target.value)}
                  />
                ) : (
                  <div className="gen-text-readonly medicacion-structured">
                    {medicacionData.length > 0 ? (
                      <>
                        {/* Medicación de Internación */}
                        {medicacionData.filter(m => m.tipo === "internacion").length > 0 && (
                          <div className="med-section">
                            <div className="med-section-title">
                              <span className="med-tag med-tag-internacion">💊 Durante Internación</span>
                            </div>
                            <div className="med-list">
                              {medicacionData
                                .filter(m => m.tipo === "internacion")
                                .map((med, i) => (
                                  <div key={i} className="med-item">
                                    <span className="med-farmaco">{med.farmaco}</span>
                                    {med.dosis && <span className="med-dosis">{med.dosis}</span>}
                                    {med.via && <span className="med-via">{med.via}</span>}
                                    {med.frecuencia && <span className="med-frecuencia">{med.frecuencia}</span>}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Medicación Previa */}
                        {medicacionData.filter(m => m.tipo === "previa").length > 0 && (
                          <div className="med-section med-section-previa">
                            <div className="med-section-title">
                              <span className="med-tag med-tag-previa">📋 Medicación Previa (Antes de Internación)</span>
                            </div>
                            <div className="med-list">
                              {medicacionData
                                .filter(m => m.tipo === "previa")
                                .map((med, i) => (
                                  <div key={i} className="med-item med-item-previa">
                                    <span className="med-farmaco">{med.farmaco}</span>
                                    {med.dosis && <span className="med-dosis">{med.dosis}</span>}
                                    {med.via && <span className="med-via">{med.via}</span>}
                                    {med.frecuencia && <span className="med-frecuencia">{med.frecuencia}</span>}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : tratamientoText.trim() ? (
                      tratamientoText.split(/\r?\n/).map((t, i) => <div key={i}>• {t}</div>)
                    ) : (
                      "—"
                    )}
                  </div>
                )}
              </div>

              {/* Indicaciones de alta */}
              <div className="gen-block">
                <div className="gen-header-row">
                  <div className="gen-key">Indicaciones de alta <span className="section-tag editable">Lo Completa el Médico</span></div>
                  <div className="gen-header-actions">
                    <FeedbackButtons section="indicaciones" />
                    {!editingIndAlta && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="Editar sección"
                        onClick={() => setEditingIndAlta(true)}
                      >
                        <FaPen />
                      </button>
                    )}
                    {editingIndAlta && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="Confirmar edición de sección"
                        onClick={() => setEditingIndAlta(false)}
                      >
                        <FaSave />
                      </button>
                    )}
                    {/* Botón para abrir modal de Notas al Alta (solo si no falleció) */}
                    {!pacienteFallecido && (
                      <button
                        type="button"
                        className="icon-btn btn-notas-alta"
                        title="Ver/Editar Recomendaciones al Alta"
                        onClick={() => setNotasAltaModalOpen(true)}
                      >
                        📝
                      </button>
                    )}
                  </div>
                </div>
                {editingIndAlta ? (
                  <textarea
                    className="gen-textarea"
                    value={indicacionesAltaText}
                    onChange={(e) => setIndicacionesAltaText(e.target.value)}
                  />
                ) : (
                  <div className="gen-text-readonly">
                    {indicacionesAltaText.trim()
                      ? indicacionesAltaText.split(/\r?\n/).map((t, i) => <div key={i}>• {t}</div>)
                      : "—"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="epc-layout history-tab">
          <div className="epc-column full-width">
            <div className="card card-history">
              <div className="section-header">
                <h3>Historial de la epicrisis</h3>
              </div>
              {history.length === 0 ? (
                <div className="empty-history">No hay eventos registrados para esta epicrisis.</div>
              ) : (
                <ul className="timeline">
                  {history.map((h, idx) => (
                    <li key={idx} className="tl-item">
                      <div className="tl-point" />
                      <div className="tl-content">
                        <div className="tl-date">{formatHistoryDate(h.at)}</div>
                        <div className="tl-action">{h.action}</div>
                        {h.by && <div className="tl-by">Realizado por: {h.by}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal de feedback obligatorio */}
      {feedbackModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {feedbackModal.rating === "bad"
                  ? "🚫 Sección incorrecta"
                  : "⚠️ Sección parcialmente correcta"}
              </h3>
            </div>
            <div className="modal-body">
              <p className="modal-intro">
                Respondé las siguientes preguntas y agregá tus observaciones:
              </p>

              {/* Preguntas obligatorias SI/NO */}
              <div className="feedback-questions">
                <div className="fb-question">
                  <span className="fb-question-label">¿Tiene omisiones?</span>
                  <div className="fb-question-options">
                    <button
                      className={`fb-option ${feedbackQuestions.hasOmissions === true ? "selected yes" : ""}`}
                      onClick={() => setFeedbackQuestions(prev => ({ ...prev, hasOmissions: true }))}
                    >
                      Sí
                    </button>
                    <button
                      className={`fb-option ${feedbackQuestions.hasOmissions === false ? "selected no" : ""}`}
                      onClick={() => setFeedbackQuestions(prev => ({ ...prev, hasOmissions: false }))}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div className="fb-question">
                  <span className="fb-question-label">¿Tiene repeticiones/excedentes?</span>
                  <div className="fb-question-options">
                    <button
                      className={`fb-option ${feedbackQuestions.hasRepetitions === true ? "selected yes" : ""}`}
                      onClick={() => setFeedbackQuestions(prev => ({ ...prev, hasRepetitions: true }))}
                    >
                      Sí
                    </button>
                    <button
                      className={`fb-option ${feedbackQuestions.hasRepetitions === false ? "selected no" : ""}`}
                      onClick={() => setFeedbackQuestions(prev => ({ ...prev, hasRepetitions: false }))}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div className="fb-question">
                  <span className="fb-question-label">¿Es confuso o erróneo?</span>
                  <div className="fb-question-options">
                    <button
                      className={`fb-option ${feedbackQuestions.isConfusing === true ? "selected yes" : ""}`}
                      onClick={() => setFeedbackQuestions(prev => ({ ...prev, isConfusing: true }))}
                    >
                      Sí
                    </button>
                    <button
                      className={`fb-option ${feedbackQuestions.isConfusing === false ? "selected no" : ""}`}
                      onClick={() => setFeedbackQuestions(prev => ({ ...prev, isConfusing: false }))}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              <textarea
                className="modal-textarea"
                placeholder="Describí qué está mal o qué debería mejorar (mínimo 30 caracteres)..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                autoFocus
              />
              <div className="modal-char-count">
                {feedbackText.trim().length}/{MIN_FEEDBACK_LENGTH} caracteres mínimo
                {feedbackTextValid && " ✓"}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn ghost" onClick={cancelFeedback}>
                Cancelar
              </button>
              <button
                className="btn primary"
                onClick={confirmFeedback}
                disabled={!feedbackTextValid || !allQuestionsAnswered || submittingFeedback}
              >
                {submittingFeedback ? "Enviando..." : "Enviar feedback"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asistente de Indicaciones al Alta */}
      {notasAltaModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-asistente-alta">
            <div className="modal-header">
              <h3>📋 Asistente de Indicaciones al Alta</h3>
              <button
                className="modal-close-btn"
                onClick={() => setNotasAltaModalOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body modal-body-split">
              {/* Columna izquierda: Sugerencias o mensaje de óbito */}
              <div className="asistente-sugerencias">
                {pacienteFallecido ? (
                  <>
                    <h4>⚠️ Paciente Fallecido</h4>
                    <div className="obito-message">
                      <p>Se detectó que el paciente <strong>falleció durante la internación</strong>.</p>
                      <p>No corresponden indicaciones de alta para este caso.</p>
                      <p className="obito-hint">En su lugar, puede documentar:</p>
                      <ul>
                        <li>Fecha y hora del óbito</li>
                        <li>Causa del fallecimiento</li>
                        <li>Notificaciones realizadas a familiares</li>
                        <li>Trámites administrativos pendientes</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <h4>💡 Recomendaciones médicas al momento de la externación del paciente que se desprenden de los registros en su HC</h4>
                    <p className="sugerencias-desc">Haga clic en una sugerencia para agregarla a las indicaciones:</p>
                    <div className="sugerencias-lista">
                      {[
                        "Reposo relativo por 48-72 horas",
                        "Dieta blanda los primeros días",
                        "Hidratación abundante (2-3 litros/día)",
                        "Control de temperatura cada 8 horas",
                        "Consultar ante fiebre mayor a 38°C",
                        "Consultar ante dolor intenso no controlado",
                        "Control ambulatorio en 7 días",
                        "Control por consultorio externo",
                        "Continuar medicación habitual",
                        "Evitar esfuerzos físicos intensos",
                        "Cuidados de herida quirúrgica",
                        "Mantener zona limpia y seca",
                        "No suspender medicación sin indicación médica",
                        "Acudir a urgencias ante signos de alarma"
                      ].map((sugerencia, idx) => (
                        <button
                          key={idx}
                          className="sugerencia-item"
                          onClick={() => {
                            const bulletPoint = "• " + sugerencia;
                            const newText = indicacionesAltaText.trim()
                              ? indicacionesAltaText + "\n" + bulletPoint
                              : bulletPoint;
                            setIndicacionesAltaText(newText);
                          }}
                        >
                          + {sugerencia}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Columna derecha: Editor */}
              <div className="asistente-editor">
                <h4>📝 Indicaciones al Alta</h4>
                <p className="editor-desc">Edite o agregue las indicaciones para el paciente:</p>
                <textarea
                  className="modal-textarea indicaciones-textarea"
                  placeholder="Escriba las indicaciones al alta para el paciente..."
                  value={indicacionesAltaText}
                  onChange={(e) => setIndicacionesAltaText(e.target.value)}
                  rows={15}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn ghost"
                onClick={() => setNotasAltaModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="btn primary"
                onClick={() => setNotasAltaModalOpen(false)}
              >
                <FaSave /> Guardar Indicaciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Laboratorio */}
      {labDetailModal.open && (
        <div className="modal-overlay">
          <div className="modal-content modal-lab-detalle">
            <div className="modal-header">
              <h3>🔬 Laboratorios - Selección para PDF</h3>
              <button
                className="modal-close-btn"
                onClick={() => setLabDetailModal({ open: false, fecha: "", detalle: "" })}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="lab-fecha">
                <strong>Fecha y hora:</strong> {labDetailModal.fecha}
              </div>
              <div className="lab-estudios">
                <p style={{ marginBottom: "12px", color: "#666" }}>
                  <strong>Selecciona los estudios para incluir en el PDF:</strong>
                </p>
                <div className="lab-estudios-lista" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {labDetailModal.detalle.split(",").map((estudio, idx) => {
                    const estudoTrimmed = estudio.trim();
                    return (
                      <label key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={selectedLabsForPdf.has(estudoTrimmed)}
                          onChange={(e) => {
                            const newSet = new Set(selectedLabsForPdf);
                            if (e.target.checked) {
                              newSet.add(estudoTrimmed);
                            } else {
                              newSet.delete(estudoTrimmed);
                            }
                            setSelectedLabsForPdf(newSet);
                          }}
                          style={{ cursor: "pointer" }}
                        />
                        <span>{estudoTrimmed}</span>
                      </label>
                    );
                  })}
                </div>
                <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f0f9ff", borderRadius: "6px" }}>
                  <small style={{ color: "#0369a1" }}>
                    💡 <strong>Tip:</strong> Si no seleccionas ningún estudio, el PDF mostrará solo "Laboratorios realizados (X estudios)".
                    Si seleccionas algunos, se exportarán con detalle.
                  </small>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn ghost"
                onClick={() => setLabDetailModal({ open: false, fecha: "", detalle: "" })}
              >
                Cancelar
              </button>
              <button
                className="btn primary"
                onClick={saveLabSelectionToEpc}
                disabled={saving}
              >
                {saving ? "Guardando..." : "✅ Aplicar selección"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}