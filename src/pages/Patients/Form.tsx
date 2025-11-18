import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import {
  FaUserPlus,
  FaFilePdf,
  FaCloudUploadAlt,
  FaCheck,
  FaTimes,
  FaUserEdit,
} from "react-icons/fa";
import "./patient-form.css";

type ParsedPreview = {
  structured?: {
    paciente_apellido_nombre?: string;
    admision_num?: string;
    sector?: string;
    habitacion?: string;
    cama?: string;
    fecha_ingreso?: string;
    fecha_egreso?: string;
    diagnostico_egreso_principal?: string;
    cie10?: string | null;
    obra_social?: string | null;
    nro_beneficiario?: string | null;
    dni?: string | null;
    hce_numero?: string | null;
    [key: string]: any;
  };
  pages?: number;
  [key: string]: any;
};

// ----------------- helpers -----------------

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

  if (typeof detail === "string") return detail;

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

function getStructured(parsed: ParsedPreview | null): any | null {
  if (!parsed) return null;
  const anyParsed: any = parsed as any;
  return anyParsed.structured ?? parsed;
}

// Extrae apellido y nombre de un string tipo
// "FERNANDEZ,GISELLE VALERIA Nro. Admisión ..."
function splitApellidoNombre(raw?: string | null): { apellido: string; nombre: string } {
  if (!raw) return { apellido: "", nombre: "" };

  let txt = raw;

  const upper = txt.toUpperCase();
  const idxEntidad = upper.indexOf("ENTIDAD");
  if (idxEntidad >= 0) {
    txt = txt.slice(0, idxEntidad);
  }
  const idxAdm = upper.indexOf("NRO. ADMISI");
  if (idxAdm >= 0) {
    txt = txt.slice(0, idxAdm);
  }

  const [ap, nom] = txt.split(",", 2);
  return {
    apellido: (ap || "").trim(),
    nombre: (nom || "").trim(),
  };
}

// Fallback: extrae apellido y nombre desde el nombre de archivo PDF
// Ej: "HCE_01.1_FERNANDEZ_GISELLE_VALERIA_653476_1_0.pdf"
function deriveNameFromFilename(filename?: string | null): { apellido: string; nombre: string } {
  if (!filename) return { apellido: "", nombre: "" };

  const base = filename.replace(/\.pdf$/i, "");
  const parts = base.split("_").filter(Boolean);

  if (parts.length === 0) return { apellido: "", nombre: "" };

  let apellidoIdx = -1;

  for (let i = 0; i < parts.length; i++) {
    const token = parts[i];

    if (/^HCE$/i.test(token)) continue;
    if (/^\d+(\.\d+)?$/.test(token)) continue;

    apellidoIdx = i;
    break;
  }

  if (apellidoIdx === -1) return { apellido: "", nombre: "" };

  const apellidoRaw = parts[apellidoIdx] || "";
  const apellido = apellidoRaw.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, " ").trim();

  const nombreTokens: string[] = [];
  for (let j = apellidoIdx + 1; j < parts.length; j++) {
    const token = parts[j];
    if (/^\d/.test(token)) break;
    const clean = token.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, " ").trim();
    if (clean) nombreTokens.push(clean);
  }

  const nombre = nombreTokens.join(" ").replace(/\s+/g, " ").trim();

  return { apellido, nombre };
}

// ----------------- componente principal -----------------

const PatientForm: React.FC = () => {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [tab, setTab] = useState<"manual" | "hce">("manual");

  // Datos manuales
  const [apellido, setApellido] = useState("");
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [obraSocial, setObraSocial] = useState("");
  const [nroBenef, setNroBenef] = useState("");
  const [hceNumero, setHceNumero] = useState("");
  const [sector, setSector] = useState("");
  const [habitacion, setHabitacion] = useState("");
  const [cama, setCama] = useState("");

  // HCE
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedPreview | null>(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // Cargar paciente si es edición
  useEffect(() => {
    if (!isEditMode) return;

    const fetchPatient = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/patients/${id}`);
        setApellido(data.apellido || "");
        setNombre(data.nombre || "");
        setDni(data.dni || "");
        setObraSocial(data.obra_social || "");
        setNroBenef(data.nro_beneficiario || "");
        setHceNumero(data.hce_numero || data.admision_num || "");
        setSector(data.sector || "");
        setHabitacion(data.habitacion || "");
        setCama(data.cama || "");
      } catch (err: any) {
        setError(formatError(err, "Error al cargar datos del paciente"));
      } finally {
        setLoading(false);
      }
    };

    setTab("manual");
    fetchPatient();
  }, [id, isEditMode]);

  const resetMessages = () => {
    setError(null);
    setOkMsg(null);
  };

  // Guardar paciente (y si hay PDF, subir HCE al backend)
  const onSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    const payload = {
      apellido,
      nombre,
      dni: dni || null,
      obra_social: obraSocial || null,
      nro_beneficiario: nroBenef || null,
      hce_numero: hceNumero || null,   // número de HCE / admisión
      sector: sector || null,
      habitacion: habitacion || null,
      cama: cama || null,
    };

    try {
      let patientId: string | undefined = id || undefined;

      if (isEditMode && id) {
        await api.put(`/patients/${id}`, payload);
        patientId = id;
        setOkMsg("Paciente actualizado correctamente.");
      } else {
        const { data } = await api.post("/patients", payload);
        patientId = data?.id;
        setOkMsg("Paciente creado correctamente.");
      }

      // Si hay HCE subida, la enviamos a /hce/upload para que quede en Mongo
      if (file && patientId) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("patient_id", patientId);
        fd.append("use_ai", "true");

        try {
          await api.post("/hce/upload", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (errUpload: any) {
          console.error("Error subiendo HCE:", errUpload);
          setError((prev) =>
            (prev ? prev + " | " : "") +
            formatError(errUpload, "El paciente se guardó, pero falló la carga de la HCE.")
          );
        }
      }

      setTimeout(() => nav("/admin/patients"), 400);
    } catch (err: any) {
      setError(formatError(err, "Error al guardar paciente"));
    } finally {
      setLoading(false);
    }
  };

  // Analizar HCE (solo prellenar datos)
  const onUploadHCE = async () => {
    if (!file) return;
    resetMessages();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post<ParsedPreview>("/patients/parse-hce", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setParsed(data);

      const structured = getStructured(data);

      // 1) Nombre y apellido
      let { apellido: ap, nombre: nom } = splitApellidoNombre(
        structured?.paciente_apellido_nombre
      );

      if ((!ap || !nom) && file?.name) {
        const fromFile = deriveNameFromFilename(file.name);
        if (!ap) ap = fromFile.apellido;
        if (!nom) nom = fromFile.nombre;
      }

      if (ap) setApellido(ap);
      if (nom) setNombre(nom);

      // 2) Datos clínicos básicos que te interesan en el paciente
      if (structured?.dni && !dni) setDni(String(structured.dni));
      if ((structured?.admision_num || structured?.hce_numero) && !hceNumero) {
        setHceNumero(String(structured.admision_num || structured.hce_numero));
      }
      if (structured?.sector && !sector) setSector(String(structured.sector));
      if (structured?.habitacion && !habitacion) {
        setHabitacion(String(structured.habitacion));
      }
      if (structured?.cama && !cama) setCama(String(structured.cama));

      // Obra social y N° Benef.
      if (structured?.obra_social && !obraSocial) {
        setObraSocial(String(structured.obra_social));
      }
      if (structured?.nro_beneficiario && !nroBenef) {
        setNroBenef(String(structured.nro_beneficiario));
      }

      setOkMsg("HCE analizada. Revisa los datos y guarda.");
      setTab("manual");
    } catch (err: any) {
      setError(formatError(err, "Error al importar HCE"));
    } finally {
      setLoading(false);
    }
  };

  const onDiscardHCE = () => {
    setFile(null);
    setParsed(null);
  };

  // ----------------- render -----------------

  return (
    <div className="pf-card">
      <div className="pf-card__header">
        <div>
          <h1 className="pf-title">
            {isEditMode ? (
              <>
                <FaUserEdit /> Editar paciente
              </>
            ) : (
              <>
                <FaUserPlus /> Nuevo paciente
              </>
            )}
          </h1>
          <p className="pf-subtitle">
            Podés cargar los datos de forma manual o subir una HCE en PDF para
            que la IA la analice y prellene la información.
          </p>
        </div>
      </div>

      <div className="pf-tabs">
        <button
          type="button"
          className={`pf-tab ${tab === "manual" ? "pf-tab--active" : ""}`}
          onClick={() => setTab("manual")}
        >
          Datos manuales
        </button>
        <button
          type="button"
          className={`pf-tab ${tab === "hce" ? "pf-tab--active" : ""}`}
          onClick={() => setTab("hce")}
        >
          HCE (PDF)
        </button>
      </div>

      {error && (
        <div className="pf-alert pf-alert--error" role="alert">
          {error}
        </div>
      )}
      {okMsg && (
        <div className="pf-alert pf-alert--ok" role="status">
          {okMsg}
        </div>
      )}

      {/* TAB: Datos manuales */}
      {tab === "manual" && (
        <form onSubmit={onSubmitManual} className="pf-form-grid">
          <div className="pf-group">
            <label htmlFor="apellido" className="pf-label required">
              Apellido
            </label>
            <input
              id="apellido"
              className="pf-input"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
              placeholder="Ej.: Fernández"
              autoComplete="family-name"
              disabled={loading}
            />
          </div>

          <div className="pf-group">
            <label htmlFor="nombre" className="pf-label required">
              Nombre
            </label>
            <input
              id="nombre"
              className="pf-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Ej.: Giselle Valeria"
              autoComplete="given-name"
              disabled={loading}
            />
          </div>

          <div className="pf-group">
            <label htmlFor="dni" className="pf-label">
              DNI
            </label>
            <input
              id="dni"
              className="pf-input"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ej.: 12345678"
              disabled={loading}
            />
          </div>

          <div className="pf-group">
            <label htmlFor="obra_social" className="pf-label">
              Obra social
            </label>
            <input
              id="obra_social"
              className="pf-input"
              value={obraSocial}
              onChange={(e) => setObraSocial(e.target.value)}
              placeholder="Ej.: OSDE"
              disabled={loading}
            />
          </div>

          <div className="pf-group">
            <label htmlFor="nro_benef" className="pf-label">
              N° beneficiario
            </label>
            <input
              id="nro_benef"
              className="pf-input"
              value={nroBenef}
              onChange={(e) => setNroBenef(e.target.value)}
              placeholder="Ej.: 61278203301"
              disabled={loading}
            />
          </div>

          <div className="pf-group">
            <label htmlFor="hce_numero" className="pf-label">
              N° HCE / N° de admisión
            </label>
            <input
              id="hce_numero"
              className="pf-input"
              value={hceNumero}
              onChange={(e) => setHceNumero(e.target.value)}
              placeholder="Ej.: 653476-1"
              disabled={loading}
            />
          </div>

          <div className="pf-group">
            <label htmlFor="sector" className="pf-label">
              Sector
            </label>
            <input
              id="sector"
              className="pf-input"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Ej.: EMERGENCIAS - INTERNACION"
              disabled={loading}
            />
          </div>

          <div className="pf-group">
            <label htmlFor="habitacion" className="pf-label">
              Habitación
            </label>
            <input
              id="habitacion"
              className="pf-input"
              value={habitacion}
              onChange={(e) => setHabitacion(e.target.value)}
              placeholder="Ej.: 033"
              disabled={loading}
            />
          </div>

          <div className="pf-group">
            <label htmlFor="cama" className="pf-label">
              Cama
            </label>
            <input
              id="cama"
              className="pf-input"
              value={cama}
              onChange={(e) => setCama(e.target.value)}
              placeholder="Ej.: 01"
              disabled={loading}
            />
          </div>

          <div className="pf-actions">
            <button
              type="submit"
              className="pf-btn pf-btn--primary"
              disabled={loading}
            >
              <FaCheck /> {isEditMode ? "Guardar cambios" : "Guardar paciente"}
            </button>
            <button
              type="button"
              className="pf-btn pf-btn--ghost"
              onClick={() => nav("/admin/patients")}
              disabled={loading}
            >
              <FaTimes /> Cancelar
            </button>
          </div>
        </form>
      )}

      {/* TAB: HCE */}
      {tab === "hce" && (
        <div className="pf-hce-pane">
          <div className="pf-upload-area">
            <label className="pf-upload-label">
              <FaFilePdf className="pf-upload-icon" />
              <span>
                Seleccioná un PDF de HCE para analizar y prellenar los datos del
                paciente.
              </span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                    setParsed(null);
                    resetMessages();
                  }
                }}
                disabled={loading}
                style={{ display: "none" }}
              />
            </label>

            {file && (
              <div className="pf-upload-file">
                <FaFilePdf />
                <span>{file.name}</span>
              </div>
            )}

            <div className="pf-upload-actions">
              <button
                type="button"
                className="pf-btn pf-btn--primary"
                onClick={onUploadHCE}
                disabled={loading || !file}
              >
                <FaCloudUploadAlt /> Analizar HCE
              </button>
              {file && (
                <button
                  type="button"
                  className="pf-btn pf-btn--ghost"
                  onClick={onDiscardHCE}
                  disabled={loading}
                >
                  <FaTimes /> Descartar
                </button>
              )}
            </div>
          </div>

          {parsed &&
            (() => {
              const structured = getStructured(parsed);
              let { apellido: ap, nombre: nom } = splitApellidoNombre(
                structured?.paciente_apellido_nombre
              );

              if ((!ap || !nom) && file?.name) {
                const fromFile = deriveNameFromFilename(file.name);
                if (!ap) ap = fromFile.apellido;
                if (!nom) nom = fromFile.nombre;
              }

              return (
                <div className="pf-preview">
                  <div className="pf-preview__title">
                    Previsualización (parseada)
                  </div>

                  <div className="pf-kv">
                    <span className="k">Paciente</span>
                    <span className="v">
                      {ap || "-"}, {nom || "-"}
                    </span>
                  </div>
                  <div className="pf-kv">
                    <span className="k">N° HCE / Admisión</span>
                    <span className="v">
                      {structured?.admision_num ?? structured?.hce_numero ?? "-"}
                    </span>
                  </div>
                  <div className="pf-kv">
                    <span className="k">Sector</span>
                    <span className="v">{structured?.sector ?? "-"}</span>
                  </div>
                  <div className="pf-kv">
                    <span className="k">Habitación / Cama</span>
                    <span className="v">
                      {structured?.habitacion ?? "-"} /{" "}
                      {structured?.cama ?? "-"}
                    </span>
                  </div>
                  <div className="pf-kv">
                    <span className="k">Ingreso</span>
                    <span className="v">
                      {structured?.fecha_ingreso ?? "-"}
                    </span>
                  </div>
                  <div className="pf-kv">
                    <span className="k">Egreso</span>
                    <span className="v">
                      {structured?.fecha_egreso ?? "-"}
                    </span>
                  </div>
                  <div className="pf-kv">
                    <span className="k">Diagnóstico principal</span>
                    <span className="v">
                      {structured?.diagnostico_egreso_principal ?? "-"}
                    </span>
                  </div>
                  <div className="pf-kv">
                    <span className="k">CIE-10</span>
                    <span className="v">{structured?.cie10 ?? "-"}</span>
                  </div>
                </div>
              );
            })()}
        </div>
      )}
    </div>
  );
};

export default PatientForm;