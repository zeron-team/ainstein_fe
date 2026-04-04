// src/pages/EPC/components/EPCHeader.tsx
// Header with patient info, navigation, and AI generation metadata

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFileMedical } from "react-icons/fa";
import type { EPC, EPCContext, EPCEvent } from "@/types/epc";
import type { Patient } from "@/types/patient";
import { fullName, formatHistoryDate } from "@/utils/format";

interface EPCHeaderProps {
  epc: EPC;
  patient: Patient | null;
  demographics: { sexo?: string | null; edad?: number | null } | null;
  generated: EPCContext["generated"] | null;
  history: EPCEvent[];
  medicoNombre: string;
  fechaEmision: string;
  firmado: boolean;
}

export default function EPCHeader({
  epc,
  patient,
  demographics,
  generated,
  history,
  medicoNombre,
  fechaEmision,
  firmado,
}: EPCHeaderProps) {
  const navigate = useNavigate();

  const estadoTagCls = useMemo(() => `tag ${epc.estado ?? "borrador"}`, [epc.estado]);
  const nombrePaciente = fullName(patient);
  const sexoEdad = [
    (demographics?.sexo || patient?.sexo || "") &&
    `Sexo: ${demographics?.sexo || patient?.sexo}`,
    demographics?.edad != null && `Edad: ${demographics?.edad}`,
  ]
    .filter(Boolean)
    .join(" \u2022 ");

  const medicoDisplay = medicoNombre || epc.medico_responsable || "";

  return (
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
            <b>N&deg; Benef.:</b> {patient.nro_beneficiario}
          </div>
        )}
      </div>

      <div className="meta meta-history">
        <div>
          <b>Construida / validada por:</b> {medicoDisplay || "\u2014"}
          {fechaEmision && ` \u00b7 ${fechaEmision}`}
          {firmado && " \u00b7 Firmada"}
        </div>
        <div>
          <b>Generada por IA:</b> {generated?.provider || "\u2014"}
          {generated?.model && ` \u00b7 ${generated.model}`}
          {generated?.at && ` \u00b7 ${formatHistoryDate(generated.at)}`}
        </div>
        {history.length > 0 && (
          <div className="history-list">
            {history.slice(0, 3).map((h, idx) => (
              <div key={idx} className="history-item">
                <span className="history-dot" />
                <span className="history-text">
                  <b>{h.action}</b>
                  {h.by && ` \u00b7 ${h.by}`}
                  {h.at && ` \u00b7 ${formatHistoryDate(h.at)}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
