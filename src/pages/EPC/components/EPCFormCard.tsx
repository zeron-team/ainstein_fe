// src/pages/EPC/components/EPCFormCard.tsx
// The EPC form fields, toolbar, and action buttons

import {
  FaClipboard,
  FaClipboardCheck,
  FaCheck,
  FaSave,
  FaTimes,
  FaDownload,
  FaPrint,
  FaUserMd,
} from "react-icons/fa";
import type { EPC, SectionKey } from "@/types/epc";
import type { Doctor } from "@/types/patient";

interface EPCFormCardProps {
  epc: EPC;
  doctors: Doctor[];

  // Form values
  titulo: string;
  setTitulo: (v: string) => void;
  fechaEmision: string;
  setFechaEmision: (v: string) => void;
  firmado: boolean;
  setFirmado: (v: boolean) => void;
  medicoId: string;
  onDoctorChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;

  // Actions
  generating: boolean;
  saving: boolean;
  isAnyEditing: boolean;
  onGenerate: () => void;
  onSave: () => void;
  onDownloadPdf: (id: string) => void;
  onPrint: (id: string) => void;

  // Evaluation
  evaluationMode: boolean;
  toggleEvaluationMode: () => void;
  setEvaluationMode: (v: boolean) => void;
  setEvalValidationError: (v: string | null) => void;
  saveEvaluation: () => void;
  allSectionsRated: boolean;
  getVisibleSections: () => SectionKey[];
  getUnratedSections: () => string[];
  evalValidationError: string | null;
  previousEvaluation: { has_previous: boolean; evaluated_at: string | null; evaluator_name: string | null } | null;
  loadingPreviousEval: boolean;

  // Toast
  toastOk: string | null;
  toastErr: string | null;
}

export default function EPCFormCard({
  epc, doctors,
  titulo, setTitulo,
  fechaEmision, setFechaEmision,
  firmado, setFirmado,
  medicoId, onDoctorChange,
  generating, saving, isAnyEditing,
  onGenerate, onSave, onDownloadPdf, onPrint,
  evaluationMode, toggleEvaluationMode, setEvaluationMode, setEvalValidationError,
  saveEvaluation, allSectionsRated, getVisibleSections, getUnratedSections,
  evalValidationError, previousEvaluation, loadingPreviousEval,
  toastOk, toastErr,
}: EPCFormCardProps) {
  return (
    <div className="card card-epc-main">
      <div className="section-header">
        <h3>Datos de la epicrisis</h3>
      </div>
      <div className="grid2">
        <div className="field">
          <label className="label">Titulo</label>
          <input
            className="input"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Epicrisis de internacion"
          />
        </div>

        <div className="field">
          <label className="label">Medico responsable</label>
          <div className="row" style={{ gap: 8 }}>
            <FaUserMd style={{ opacity: 0.7 }} />
            <select className="select" value={medicoId} onChange={onDoctorChange}>
              <option value="">
                {doctors.length ? "\u2014 seleccionar \u2014" : "\u2014 sin medicos cargados \u2014"}
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
          <label className="label">Fecha de emision</label>
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
          <span>Firmado por medico</span>
          {firmado && <FaCheck style={{ color: "#7bf0b7" }} />}
        </label>
      </div>

      <div className="toolbar">
        <button className="btn" onClick={onGenerate} disabled={generating}>
          <FaClipboard /> {generating ? "Generando\u2026" : "Generar / Regenerar"}
        </button>

        {isAnyEditing && !evaluationMode && (
          <button
            className="btn primary"
            onClick={onSave}
            disabled={saving}
            title="Guardar cambios de la EPC"
          >
            <FaSave />
            {saving ? "Guardando\u2026" : "Guardar"}
          </button>
        )}

        {!evaluationMode ? (
          <button className="btn eval-btn" onClick={toggleEvaluationMode}>
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
            <FaTimes /> Cancelar Evaluacion
          </button>
        )}

        {evaluationMode && (
          <button
            className={`btn primary eval-save-btn ${!allSectionsRated ? "disabled" : ""}`}
            onClick={saveEvaluation}
            disabled={!allSectionsRated}
            title={!allSectionsRated ? `Faltan evaluar: ${getUnratedSections().join(", ")}` : "Guardar evaluacion completa"}
          >
            <FaCheck /> Guardar Evaluacion ({getVisibleSections().length - getUnratedSections().length}/{getVisibleSections().length})
          </button>
        )}



        <button className="btn" onClick={() => onDownloadPdf(epc.id)}>
          <FaDownload /> Descargar PDF
        </button>

        <button className="btn" onClick={() => onPrint(epc.id)}>
          <FaPrint /> Imprimir
        </button>
      </div>

      {evalValidationError && (
        <div className="toast err eval-error">
          <strong>Evaluacion incompleta:</strong> {evalValidationError}
        </div>
      )}

      {toastOk && <div className="toast ok">{toastOk}</div>}
      {toastErr && <div className="toast err">{toastErr}</div>}
    </div>
  );
}
