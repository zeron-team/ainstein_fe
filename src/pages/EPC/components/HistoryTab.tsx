// src/pages/EPC/components/HistoryTab.tsx
// History tab showing timeline of EPC events

import type { EPCEvent } from "@/types/epc";
import { formatHistoryDate } from "@/utils/format";

interface HistoryTabProps {
  history: EPCEvent[];
}

export default function HistoryTab({ history }: HistoryTabProps) {
  return (
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
  );
}
