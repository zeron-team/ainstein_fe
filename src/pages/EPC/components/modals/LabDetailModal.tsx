// src/pages/EPC/components/modals/LabDetailModal.tsx
// Lab detail modal with PDF selection

import { FaTimes } from "react-icons/fa";

interface LabDetailModalProps {
  open: boolean;
  fecha: string;
  detalle: string;
  onClose: () => void;
  selectedLabsForPdf: Set<string>;
  setSelectedLabsForPdf: (v: Set<string>) => void;
  saveLabSelectionToEpc: () => void;
  saving: boolean;
}

export default function LabDetailModal({
  open, fecha, detalle, onClose,
  selectedLabsForPdf, setSelectedLabsForPdf,
  saveLabSelectionToEpc, saving,
}: LabDetailModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-lab-detalle">
        <div className="modal-header">
          <h3>Laboratorios - Seleccion para PDF</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <div className="lab-fecha">
            <strong>Fecha y hora:</strong> {fecha}
          </div>
          <div className="lab-estudios">
            <p style={{ marginBottom: "12px", color: "#666" }}>
              <strong>Selecciona los estudios para incluir en el PDF:</strong>
            </p>
            <div className="lab-estudios-lista" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {detalle.split(",").map((estudio, idx) => {
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
                <strong>Tip:</strong> Si no seleccionas ningun estudio, el PDF mostrara solo "Laboratorios realizados (X estudios)".
                Si seleccionas algunos, se exportaran con detalle.
              </small>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn primary"
            onClick={saveLabSelectionToEpc}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Aplicar seleccion"}
          </button>
        </div>
      </div>
    </div>
  );
}
