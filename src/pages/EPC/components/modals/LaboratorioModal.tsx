// src/pages/EPC/components/modals/LaboratorioModal.tsx
// Lab overview modal

import { FaTimes } from "react-icons/fa";

interface LaboratorioModalProps {
  open: boolean;
  onClose: () => void;
  laboratoriosData: string[];
}

export default function LaboratorioModal({ open, onClose, laboratoriosData }: LaboratorioModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-laboratorio">
        <div className="modal-header">
          <h3>Determinaciones de Laboratorio</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <div className="laboratorio-content">
            {laboratoriosData.length === 0 ? (
              <p className="empty-state">No hay determinaciones de laboratorio registradas.</p>
            ) : (
              <ul className="lab-list">
                {laboratoriosData.map((lab, i) => (
                  <li key={i} className="lab-item">{lab}</li>
                ))}
              </ul>
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
