// src/pages/EPC/components/CorrectionsTab.tsx
// Corrections tab showing all section corrections

import type { LocalCorrectionEntry } from "../hooks/useEpcCorrections";

interface CorrectionsTabProps {
  localCorrections: LocalCorrectionEntry[];
  correctionsSummary: { move: number; remove: number; confirm: number; total: number };
}

export default function CorrectionsTab({ localCorrections, correctionsSummary }: CorrectionsTabProps) {
  return (
    <div className="epc-layout history-tab">
      <div className="epc-column full-width">
        <div className="card card-history">
          <div className="section-header">
            <h3>Correcciones realizadas</h3>
            <div className="corrections-summary-tags" style={{ marginLeft: 12 }}>
              {correctionsSummary.move > 0 && (
                <span className="corr-tag corr-move">{"\u2194"} {correctionsSummary.move} trasladados</span>
              )}
              {correctionsSummary.remove > 0 && (
                <span className="corr-tag corr-remove">{"\u2717"} {correctionsSummary.remove} eliminados</span>
              )}
              {correctionsSummary.confirm > 0 && (
                <span className="corr-tag corr-confirm">{"\u2713"} {correctionsSummary.confirm} confirmados</span>
              )}
            </div>
          </div>
          {localCorrections.length === 0 ? (
            <div className="empty-history">No hay correcciones registradas para esta epicrisis.</div>
          ) : (
            <div className="corrections-detail-list" style={{ maxHeight: "none" }}>
              {localCorrections.map((c, i) => (
                <div key={i} className={`correction-item correction-${c.action}`}>
                  <span className="correction-action-icon">
                    {c.action === "move" ? "\u2194" : c.action === "remove" ? "\u2717" : "\u2713"}
                  </span>
                  <span className="correction-item-text">{c.item}</span>
                  <span className="correction-flow">
                    <span className="correction-section-name">{c.from_section}</span>
                    {c.action === "move" && c.to_section && (
                      <>
                        <span className="correction-arrow">{"\u2192"}</span>
                        <span className="correction-section-name">{c.to_section}</span>
                      </>
                    )}
                    {c.action === "remove" && (
                      <span className="corr-tag corr-remove" style={{ marginLeft: 6 }}>eliminado</span>
                    )}
                    {c.action === "confirm" && (
                      <span className="corr-tag corr-confirm" style={{ marginLeft: 6 }}>confirmado</span>
                    )}
                  </span>
                  {c.created_at && (
                    <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8, flexShrink: 0 }}>
                      {new Date(c.created_at).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
