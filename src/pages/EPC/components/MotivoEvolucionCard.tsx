// src/pages/EPC/components/MotivoEvolucionCard.tsx
// Motivo de internacion + Evolucion sections with editing and feedback

import { FaCopy, FaDownload, FaBrain, FaPen, FaSave } from "react-icons/fa";
import type { EPCContext, SectionKey, SectionRating } from "@/types/epc";
import { formatHistoryDate } from "@/utils/format";
import FeedbackButtons from "./FeedbackButtons";

interface MotivoEvolucionCardProps {
  generated: EPCContext["generated"] | null;
  generating: boolean;

  motivoText: string;
  setMotivoText: (v: string) => void;
  evolucionText: string;
  setEvolucionText: (v: string) => void;

  editingMotivo: boolean;
  setEditingMotivo: (v: boolean) => void;
  editingEvolucion: boolean;
  setEditingEvolucion: (v: boolean) => void;

  onSave: () => void;
  copyGenerated: () => void;
  downloadGenerated: () => void;

  evaluationMode: boolean;
  sectionRatings: Record<SectionKey, SectionRating>;
  handleRating: (section: string, rating: "ok" | "partial" | "bad" | "hce_bad") => void;
}

export default function MotivoEvolucionCard({
  generated, generating,
  motivoText, setMotivoText,
  evolucionText, setEvolucionText,
  editingMotivo, setEditingMotivo,
  editingEvolucion, setEditingEvolucion,
  onSave, copyGenerated, downloadGenerated,
  evaluationMode, sectionRatings, handleRating,
}: MotivoEvolucionCardProps) {
  return (
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
          <b>Generado:</b> {generated?.at ? formatHistoryDate(generated.at) : "\u2014"}
        </span>
        <span>
          <b>HCE origen:</b> {generated?.hce_source_id || "\u2014"}
        </span>
      </div>



      {/* Motivo internacion */}
      <div className="gen-block">
        <div className="gen-header-row">
          <div className="gen-key">Motivo internacion</div>
          <div className="gen-header-actions">
            <FeedbackButtons
              section="motivo"
              evaluationMode={evaluationMode}
              sectionRatings={sectionRatings}
              handleRating={handleRating}
              showHceBad
            />
            {!editingMotivo && (
              <button
                type="button"
                className="icon-btn"
                title="Editar seccion"
                onClick={() => setEditingMotivo(true)}
              >
                <FaPen />
              </button>
            )}
            {editingMotivo && (
              <button
                type="button"
                className="icon-btn"
                title="Confirmar edicion de seccion"
                onClick={() => { onSave(); setEditingMotivo(false); }}
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
          <div className="gen-text-readonly">{motivoText.trim() || "\u2014"}</div>
        )}
      </div>

      {/* Evolucion */}
      <div className="gen-block">
        <div className="gen-header-row">
          <div className="gen-key">Evolucion</div>
          <div className="gen-header-actions">
            <FeedbackButtons
              section="evolucion"
              evaluationMode={evaluationMode}
              sectionRatings={sectionRatings}
              handleRating={handleRating}
              showHceBad
            />
            {!editingEvolucion && (
              <button
                type="button"
                className="icon-btn"
                title="Editar seccion"
                onClick={() => setEditingEvolucion(true)}
              >
                <FaPen />
              </button>
            )}
            {editingEvolucion && (
              <button
                type="button"
                className="icon-btn"
                title="Confirmar edicion de seccion"
                onClick={() => { onSave(); setEditingEvolucion(false); }}
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
              if (!texto) return "\u2014";

              const lines = texto.split('\n');
              const narrativeLines: string[] = [];
              let lastObitoLine: string | null = null;

              for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.includes("DESENLACE: OBITO") || trimmedLine.includes("**DESENLACE: OBITO**") ||
                    trimmedLine.includes("DESENLACE: \u00d3BITO") || trimmedLine.includes("**DESENLACE: \u00d3BITO**")) {
                  lastObitoLine = trimmedLine;
                } else if (trimmedLine === '---') {
                  // Ignore separators
                } else {
                  narrativeLines.push(line);
                }
              }

              const narrativeText = narrativeLines.join('\n').trim();
              const parrafos = narrativeText.split(/\n\n+/).filter(p => p.trim());

              return (
                <>
                  {parrafos.map((p, i) => (
                    <p key={i}>{p.trim()}</p>
                  ))}
                  {lastObitoLine && (
                    <div className="obito-inline">
                      <hr className="obito-divider" />
                      <span className="obito-text">
                        {(() => {
                          const fechaMatch = lastObitoLine.match(/Fecha:\s*([^\n|]+)/);
                          const horaMatch = lastObitoLine.match(/Hora:\s*(\S+)/);
                          const fecha = fechaMatch ? fechaMatch[1].trim() : "no registrada";
                          const hora = horaMatch ? horaMatch[1].trim() : "";
                          return `\u26ab DESENLACE: \u00d3BITO - Fecha: ${fecha}${hora ? ` | Hora: ${hora}` : ""}`;
                        })()}
                      </span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
