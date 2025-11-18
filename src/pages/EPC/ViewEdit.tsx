import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import axios from "axios";
import {
  FaArrowLeft,
  FaCheck,
  FaClipboard,
  FaCopy,
  FaDownload,
  FaFileMedical,
  FaPrint,
  FaSave,
  FaUserMd,
  FaBrain,
} from "react-icons/fa";

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
  // por si en algún momento los pones también en la EPC
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

type GeneratedData = {
  motivo_internacion?: string;
  diagnostico_principal_cie10?: string;
  evolucion?: string;
  procedimientos?: any[];
  interconsultas?: any[];
  medicacion?: { farmaco: string; dosis?: string; via?: string; frecuencia?: string }[] | any[];
  indicaciones_alta?: any[];
  recomendaciones?: any[];
  [k: string]: any;
} | null;

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
  // opcional: objeto clínico que consolida datos de la HCE
  clinical?: any;
};

const STYLE_ID = "epc-viewedit-styles";

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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
// Convierte cualquier valor (ISO, YYYY-MM-DD, dd/mm/yyyy, etc) a YYYY-MM-DD
function anyToYmd(val?: string | null) {
  if (!val) return "";
  const s = val.trim();
  if (!s) return "";
  // Si ya parece ISO o YYYY-MM-DD, reutilizamos isoToYmd
  if (s.includes("-")) {
    return isoToYmd(s);
  }
  // dd/mm/yyyy o d/m/yyyy
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
  // fallback
  return isoToYmd(s);
}
function fullName(p?: Patient | null) {
  const ap = (p?.apellido || "").trim();
  const no = (p?.nombre || "").trim();
  return [ap, no].filter(Boolean).join(", ");
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
  const [demographics, setDemographics] = useState<{ sexo?: string | null; edad?: number | null } | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [generated, setGenerated] = useState<EPCContext["generated"] | null>(null);

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

  // Guardado / generación
  const [saving, setSaving] = useState(false);
  const [toastOk, setToastOk] = useState<string | null>(null);
  const [toastErr, setToastErr] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Estilos inyectados
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement("style");
      s.id = STYLE_ID;
      s.innerHTML = `
      .epc-wrap{padding:18px;color:#e6ecf7}
      .grid{display:grid;gap:16px}
      @media(min-width:1100px){.grid{grid-template-columns:1.1fr .9fr}}
      .card{border:1px solid rgba(255,255,255,.08);background:rgba(8,15,30,.6);border-radius:16px;padding:18px}
      .row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
      .title{font-weight:800;font-size:20px;display:flex;align-items:center;gap:8px}
      .meta{font-size:12px;opacity:.85;display:flex;gap:14px;flex-wrap:wrap}
      .tag{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06)}
      .tag.validada{background:rgba(120,240,170,.14);border-color:rgba(120,240,170,.35);color:#c8ffd8}
      .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .field{display:flex;flex-direction:column;gap:6px}
      .label{font-size:12px;color:#98a8c6}
      .input,.select,.date{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#eaf1ff;border-radius:10px;padding:10px 12px;font-size:14px}
      .toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
      .btn{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:#eaf3ff;padding:10px 14px;border-radius:12px;cursor:pointer}
      .btn:hover{filter:brightness(1.1);transform:translateY(-1px);transition:all .15s}
      .btn[disabled]{opacity:.6;cursor:not-allowed;transform:none !important}
      .btn.primary{background:linear-gradient(135deg,#2a5fff,#3fb2ff);border-color:rgba(80,180,255,.5)}
      .hr{height:1px;background:rgba(255,255,255,.08);margin:10px 0;border-radius:1px}

      .gen-grid{display:grid;grid-template-columns:1fr;gap:12px}
      .gen-block{background:rgba(255,255,255,.03);border:1px dashed rgba(255,255,255,.1);border-radius:12px;padding:12px}
      .gen-key{font-size:12px;color:#98a8c6;margin-bottom:4px}
      .gen-li{margin-left:18px}
      .toast{margin-top:10px;font-size:13px}
      .ok{color:#8ff0b8}
      .err{color:#ff9c9c}

      .brain-progress{display:flex;flex-direction:column;gap:8px;padding:10px 12px;margin-bottom:10px;border-radius:12px;background:rgba(19,32,60,.9);border:1px solid rgba(113,178,255,.45)}
      .brain-icon{font-size:22px;display:inline-flex;align-items:center;justify-content:center;animation:brain-pulse 1.2s infinite ease-in-out}
      .brain-bar{position:relative;overflow:hidden;height:6px;border-radius:999px;background:rgba(255,255,255,.06)}
      .brain-bar-inner{position:absolute;left:0;top:0;bottom:0;width:40%;border-radius:999px;background:linear-gradient(90deg,#4bb6ff,#6a6cff);animation:brain-progress 1.1s infinite}
      .brain-text{font-size:12px;color:#c7d7ff}
      @keyframes brain-progress{0%{transform:translateX(-120%);}50%{transform:translateX(0);}100%{transform:translateX(140%);}}
      @keyframes brain-pulse{0%,100%{transform:scale(1);opacity:.9;}50%{transform:scale(1.15);opacity:1;}}
      `;
      document.head.appendChild(s);
    }
  }, []);

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

      // 2) Contexto completo
      const { data: ctx } = await api.get<EPCContext>(`/epc/${epcData.id}/context`);

      setEpc(ctx.epc);
      setPatient(ctx.patient || null);
      setAdmission(ctx.admission || null);
      setDemographics(ctx.demographics || null);
      setDoctors(ctx.doctors || []);
      setGenerated(ctx.generated || null);

      // Contexto clínico enriquecido (backend) + fallback desde HCE estructurada
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

      // Médico: si el EPC ya tiene nombre, lo respetamos; si no, nada seleccionado
      const currentMedName = (ctx.epc.medico_responsable || "").trim();
      if (currentMedName) {
        setMedicoNombre(currentMedName);
        const found = (ctx.doctors || []).find((d) => d.full_name === currentMedName);
        setMedicoId(found?.id || "");
      } else {
        setMedicoNombre("");
        setMedicoId("");
      }

      // Datos clínicos (admisión / clínicos) con múltiples fuentes
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
      const payload: Record<string, any> = {
        titulo,
        diagnostico_principal_cie10: cie10 || null,
        fecha_emision: fechaEmision || null,
        firmado_por_medico: firmado,
        medico_responsable: medicoNombre || null,
        estado: "validada",
        // si más adelante agregás soporte en backend para número HC, sector, etc,
        // podrías incluirlos aquí:
        // numero_historia_clinica: nroHC || null,
        // sector,
        // habitacion: hab,
        // cama,
      };
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

  function onPrint() {
    if (!epc) return;
    const url = `${api.defaults.baseURL?.replace(/\/$/, "")}/epc/${epc.id}/print`;
    window.open(url, "_blank");
  }

  function onDoctorChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setMedicoId(val);
    const doc = doctors.find((d) => d.id === val);
    setMedicoNombre(doc ? doc.full_name : "");
  }

  function copyGenerated() {
    const json = JSON.stringify(generated?.data || {}, null, 2);
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
        data: generated?.data || {},
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
    (demographics?.sexo || patient?.sexo || "") && `Sexo: ${demographics?.sexo || patient?.sexo}`,
    demographics?.edad != null && `Edad: ${demographics?.edad}`,
  ]
    .filter(Boolean)
    .join(" • ");

  const rawGen: any = generated || null;
  const g: any =
    (rawGen && rawGen.data && typeof rawGen.data === "object" ? rawGen.data : rawGen) || null;

  return (
    <div className="epc-wrap">
      {/* Encabezado */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="row">
            <button className="btn" onClick={() => navigate(-1)} title="Volver">
              <FaArrowLeft /> Volver
            </button>
            <div className="title">
              <FaFileMedical /> Epicrisis
            </div>
            <span className={estadoTagCls}>{epc.estado}</span>
          </div>
          <div className="meta">
            <b>ID EPC:</b> {epc.id}
          </div>
        </div>
        <div className="hr" />
        <div className="meta">
          <div>
            <b>Paciente:</b> {nombrePaciente || epc.patient_id}
          </div>
          {sexoEdad && (
            <div>
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
      </div>

      <div className="grid">
        {/* Columna izquierda: formulario EPC */}
        <div className="card">
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

            <div className="field">
              <label className="label">Diagnóstico principal (CIE-10)</label>
              <input
                className="input"
                placeholder="Ej.: S52.3"
                value={cie10}
                onChange={(e) => setCie10(e.target.value.toUpperCase())}
              />
            </div>

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
            <button className="btn primary" onClick={onSave} disabled={saving}>
              <FaSave />
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button className="btn" onClick={onPrint}>
              <FaPrint /> Imprimir
            </button>
          </div>

          {toastOk && <div className="toast ok">{toastOk}</div>}
          {toastErr && <div className="toast err">{toastErr}</div>}
        </div>

        {/* Columna derecha: datos clínicos + generado */}
        <div className="card">
          <div className="title">Datos clínicos</div>
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

          <div className="hr" />

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

          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="title" style={{ fontSize: 18 }}>
              Contenido generado
            </div>
            <div className="row">
              <button className="btn" onClick={copyGenerated}>
                <FaCopy /> Copiar
              </button>
              <button className="btn" onClick={downloadGenerated}>
                <FaDownload /> Descargar
              </button>
            </div>
          </div>

          <div className="meta" style={{ marginTop: 6 }}>
            <div>
              <b>Generado:</b> {generated?.at || "—"}
            </div>
            <div>
              <b>HCE origen:</b> {generated?.hce_source_id || "—"}
            </div>
            <div>
              <b>Proveedor / Modelo</b> {generated?.provider || "—"} ·{" "}
              {generated?.model || "—"}
            </div>
          </div>

          <div className="hr" />

          {/* Render amigable del JSON generado */}
          <div className="gen-grid">
            <div className="gen-block">
              <div className="gen-key">Motivo internación</div>
              <div>{g?.motivo_internacion || "—"}</div>
            </div>
            <div className="gen-block">
              <div className="gen-key">CIE-10 (modelo)</div>
              <div>{g?.diagnostico_principal_cie10 || "—"}</div>
            </div>
            <div className="gen-block">
              <div className="gen-key">Evolución</div>
              <div>{g?.evolucion || "—"}</div>
            </div>
            <div className="gen-block">
              <div className="gen-key">Procedimientos</div>
              <ul>
                {Array.isArray(g?.procedimientos) && g.procedimientos.length ? (
                  g.procedimientos.map((item: any, i: number) => {
                    const text =
                      typeof item === "string"
                        ? item
                        : item && typeof item === "object"
                        ? item.descripcion || item.detalle || JSON.stringify(item)
                        : String(item ?? "");
                    return (
                      <li key={i} className="gen-li">
                        • {text}
                      </li>
                    );
                  })
                ) : (
                  <li className="gen-li">—</li>
                )}
              </ul>
            </div>
            <div className="gen-block">
              <div className="gen-key">Interconsultas</div>
              <ul>
                {Array.isArray(g?.interconsultas) && g.interconsultas.length ? (
                  g.interconsultas.map((item: any, i: number) => {
                    const text =
                      typeof item === "string"
                        ? item
                        : item && typeof item === "object"
                        ? item.resumen || item.especialidad || JSON.stringify(item)
                        : String(item ?? "");
                    return (
                      <li key={i} className="gen-li">
                        • {text}
                      </li>
                    );
                  })
                ) : (
                  <li className="gen-li">—</li>
                )}
              </ul>
            </div>
            <div className="gen-block">
              <div className="gen-key">Medicación</div>
              <ul>
                {Array.isArray(g?.medicacion) && g.medicacion.length ? (
                  g.medicacion.map((m: any, i: number) => {
                    if (typeof m === "string") {
                      return (
                        <li key={i} className="gen-li">
                          • {m}
                        </li>
                      );
                    }
                    const farmaco = m?.farmaco || "";
                    const dosis = m?.dosis ? ` · dosis: ${m.dosis}` : "";
                    const via = m?.via ? ` · vía: ${m.via}` : "";
                    const frecuencia = m?.frecuencia ? ` · frecuencia: ${m.frecuencia}` : "";
                    const line = `• ${farmaco}${dosis}${via}${frecuencia}`;
                    return (
                      <li key={i} className="gen-li">
                        {line}
                      </li>
                    );
                  })
                ) : (
                  <li className="gen-li">—</li>
                )}
              </ul>
            </div>
            <div className="gen-block">
              <div className="gen-key">Indicaciones de alta</div>
              <ul>
                {Array.isArray(g?.indicaciones_alta) && g.indicaciones_alta.length ? (
                  g.indicaciones_alta.map((item: any, i: number) => (
                    <li key={i} className="gen-li">
                      • {typeof item === "string" ? item : String(item ?? "")}
                    </li>
                  ))
                ) : (
                  <li className="gen-li">—</li>
                )}
              </ul>
            </div>
            <div className="gen-block">
              <div className="gen-key">Recomendaciones</div>
              <ul>
                {Array.isArray(g?.recomendaciones) && g.recomendaciones.length ? (
                  g.recomendaciones.map((item: any, i: number) => (
                    <li key={i} className="gen-li">
                      • {typeof item === "string" ? item : String(item ?? "")}
                    </li>
                  ))
                ) : (
                  <li className="gen-li">—</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}