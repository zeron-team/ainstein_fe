// src/components/EpcHistoryTimeline.jsx
import React from "react";
import "./EpcHistoryTimeline.css";

function formatDateTime(isoString) {
  if (!isoString) return "";
  // ISO: "2025-11-21T18:49:46"
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;

  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

/**
 * history: array de objetos:
 *   { at: string ISO, by: string | null, action: string }
 */
export default function EpcHistoryTimeline({ history = [] }) {
  if (!history.length) {
    return (
      <div className="epc-timeline-empty">
        No hay eventos registrados para esta epicrisis.
      </div>
    );
  }

  return (
    <div className="epc-timeline-wrapper">
      <div className="epc-timeline-header">
        <h3>Historial de la epicrisis</h3>
        <p className="epc-timeline-subtitle">
          Línea de tiempo de acciones realizadas sobre esta EPC
        </p>
      </div>

      <div className="epc-timeline-scroll">
        <div className="epc-timeline-track">
          {history.map((ev, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === history.length - 1;
            return (
              <div className="epc-timeline-item" key={idx}>
                {/* Línea + círculo */}
                <div className="epc-timeline-line">
                  {!isFirst && <span className="epc-timeline-line-left" />}
                  <span className="epc-timeline-dot-outer">
                    <span className="epc-timeline-dot-inner" />
                  </span>
                  {!isLast && <span className="epc-timeline-line-right" />}
                </div>

                {/* Tarjeta de contenido */}
                <div className="epc-timeline-card">
                  <div className="epc-timeline-date">
                    {formatDateTime(ev.at)}
                  </div>
                  <div className="epc-timeline-action">
                    {ev.action || "Acción registrada"}
                  </div>
                  <div className="epc-timeline-by">
                    Realizado por:{" "}
                    <span className="epc-timeline-by-name">
                      {ev.by || "sistema"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}