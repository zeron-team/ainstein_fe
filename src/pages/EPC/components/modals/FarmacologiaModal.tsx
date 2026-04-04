// src/pages/EPC/components/modals/FarmacologiaModal.tsx
// Farmacologia (medication) details modal

import { FaTimes } from "react-icons/fa";
import type { MedicacionItem } from "../../hooks/useEpcContext";

interface FarmacologiaModalProps {
  open: boolean;
  onClose: () => void;
  medicacionData: MedicacionItem[];
  tratamientoText: string;
}

export default function FarmacologiaModal({
  open, onClose, medicacionData, tratamientoText,
}: FarmacologiaModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-farmacologia">
        <div className="modal-header">
          <h3>Farmacologia - Plan Terapeutico</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <div className="farmacologia-content">
            {medicacionData.length > 0 ? (
              <>
                {medicacionData.filter(m => m.tipo === "internacion").length > 0 && (
                  <div className="med-section">
                    <div className="med-section-title">
                      <span className="med-tag med-tag-internacion">Durante Internacion</span>
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

                {medicacionData.filter(m => m.tipo === "previa").length > 0 && (
                  <div className="med-section med-section-previa">
                    <div className="med-section-title">
                      <span className="med-tag med-tag-previa">Medicacion Previa (Antes de Internacion)</span>
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
              <div className="med-list-simple">
                {tratamientoText.split(/\r?\n/).map((t, i) => <div key={i}>{"\u2022"} {t}</div>)}
              </div>
            ) : (
              <p className="empty-state">No hay datos de farmacologia registrados.</p>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
