// src/pages/EPC/components/modals/AltaAssistantModal.tsx
// Alta (discharge) assistant modal with dynamic suggestions

import { FaTimes, FaSave } from "react-icons/fa";
import type { EPC } from "@/types/epc";

interface AltaAssistantModalProps {
  open: boolean;
  onClose: () => void;
  epc: EPC;
  evolucionText: string;
  indicacionesAltaText: string;
  setIndicacionesAltaText: (v: string) => void;
  pacienteFallecido: boolean;
}

export default function AltaAssistantModal({
  open, onClose, epc,
  evolucionText, indicacionesAltaText, setIndicacionesAltaText,
  pacienteFallecido,
}: AltaAssistantModalProps) {
  if (!open) return null;

  const textoBase = (evolucionText + " " + (epc.diagnostico_principal_cie10 || "")).toLowerCase();

  function buildSugerencias(): string[] {
    const sugerencias: string[] = [];

    sugerencias.push("Control ambulatorio por medico de cabecera en 7-10 dias");
    sugerencias.push("Continuar esquema farmacologico segun indicaciones de egreso");
    sugerencias.push("No suspender ni modificar medicacion sin evaluacion medica previa");

    if (/sepsis|infecci[oó]n|antibiot|leucocit/.test(textoBase)) {
      sugerencias.push("Control de temperatura cada 8 horas. Consulta precoz ante T \u226538\u00b0C");
      sugerencias.push("Completar esquema antibiotico indicado sin interrupciones");
    }
    if (/deshidrata|hidrat|electrol|ionograma/.test(textoBase)) {
      sugerencias.push("Hidratacion oral abundante (minimo 2 litros/dia salvo restriccion hidrica)");
    }
    if (/diab|glucemia|insulina|hipoglucem/.test(textoBase)) {
      sugerencias.push("Control de glucemia capilar segun frecuencia indicada");
      sugerencias.push("Dieta para diabeticos segun plan nutricional indicado");
    }
    if (/hipertensi|presión arterial|antihipertens/.test(textoBase)) {
      sugerencias.push("Control de presion arterial diario. Consultar si PAS >160 o PAD >100 mmHg");
    }
    if (/cardía|cardio|fibrilaci|arritmia|insuficiencia card/.test(textoBase)) {
      sugerencias.push("Restriccion de sodio en dieta. Control de peso diario");
      sugerencias.push("Consulta precoz ante disnea progresiva, edema de miembros inferiores o palpitaciones");
    }
    if (/respirat|neumon|disnea|oxígeno|saturaci|bronc/.test(textoBase)) {
      sugerencias.push("Ejercicios respiratorios segun indicacion kinesiologica");
      sugerencias.push("Consulta precoz ante disnea progresiva o fiebre");
    }
    if (/renal|creatinina|diálisis|nefro/.test(textoBase)) {
      sugerencias.push("Control de funcion renal (creatinina, urea) en 7 dias");
    }
    if (/quirúrg|cirug|herida|postoper/.test(textoBase)) {
      sugerencias.push("Curacion de herida quirurgica cada 48-72 horas, mantener zona limpia y seca");
    }
    if (/confusi|deterioro cognitivo|desorientaci|psiquiátr/.test(textoBase)) {
      sugerencias.push("Supervision permanente por familiar o cuidador");
    }
    if (/kinesio|rehabilitaci|moviliz/.test(textoBase)) {
      sugerencias.push("Continuar plan de rehabilitacion kinesiologica ambulatoria");
    }

    sugerencias.push("Concurrir a servicio de urgencias ante signos de alarma o deterioro del estado general");

    return sugerencias;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-asistente-alta">
        <div className="modal-header">
          <h3>Asistente de Indicaciones al Alta</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body modal-body-split">
          <div className="asistente-sugerencias">
            {pacienteFallecido ? (
              <>
                <h4>Paciente Fallecido</h4>
                <div className="obito-message">
                  <p>Se detecto que el paciente <strong>fallecio durante la internacion</strong>.</p>
                  <p>No corresponden indicaciones de alta para este caso.</p>
                  <p className="obito-hint">En su lugar, puede documentar:</p>
                  <ul>
                    <li>Fecha y hora del obito</li>
                    <li>Causa del fallecimiento</li>
                    <li>Notificaciones realizadas a familiares</li>
                    <li>Tramites administrativos pendientes</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <h4>Recomendaciones medicas al momento de la externacion del paciente que se desprenden de los registros en su HC</h4>
                <p className="sugerencias-desc">Haga clic en una sugerencia para agregarla a las indicaciones:</p>
                <div className="sugerencias-lista">
                  {buildSugerencias().map((sugerencia, idx) => (
                    <button
                      key={idx}
                      className="sugerencia-item"
                      onClick={() => {
                        const bulletPoint = "\u2022 " + sugerencia;
                        const newText = indicacionesAltaText.trim()
                          ? indicacionesAltaText + "\n" + bulletPoint
                          : bulletPoint;
                        setIndicacionesAltaText(newText);
                      }}
                    >
                      + {sugerencia}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="asistente-editor">
            <h4>Indicaciones al Alta</h4>
            <p className="editor-desc">Edite o agregue las indicaciones para el paciente:</p>
            <textarea
              className="modal-textarea indicaciones-textarea"
              placeholder="Escriba las indicaciones al alta para el paciente..."
              value={indicacionesAltaText}
              onChange={(e) => setIndicacionesAltaText(e.target.value)}
              rows={15}
              autoFocus
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" onClick={onClose}>
            <FaSave /> Guardar Indicaciones
          </button>
        </div>
      </div>
    </div>
  );
}
