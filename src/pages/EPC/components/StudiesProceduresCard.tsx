// src/pages/EPC/components/StudiesProceduresCard.tsx
// Studies, Procedures, Interconsultas, Indicaciones, and Otros Datos sections

import { useMemo } from "react";
import { FaPen, FaSave } from "react-icons/fa";
import type { SectionKey, SectionRating } from "@/types/epc";
import { multilineToArray } from "@/utils/format";
import type { SectionName } from "../hooks/useEpcCorrections";
import type { MedicacionItem } from "../hooks/useEpcContext";
import DraggableSectionList from "./DraggableSectionList";
import FeedbackButtons from "./FeedbackButtons";

interface StudiesProceduresCardProps {
  // Text fields
  estudiosText: string;
  setEstudiosText: (v: string) => void;
  procedimientosText: string;
  setProcedimientosText: (v: string) => void;
  interconsultasText: string;
  setInterconsultasText: (v: string) => void;
  indicacionesAltaText: string;
  setIndicacionesAltaText: (v: string) => void;

  // Editing flags
  editingEstudios: boolean;
  setEditingEstudios: (v: boolean) => void;
  editingProc: boolean;
  setEditingProc: (v: boolean) => void;
  editingInter: boolean;
  setEditingInter: (v: boolean) => void;
  editingIndAlta: boolean;
  setEditingIndAlta: (v: boolean) => void;

  // Actions
  onSave: () => void;
  pacienteFallecido: boolean;

  // DraggableSectionList handlers
  handleSectionItemsChange: (section: SectionName, items: string[]) => void;
  handleItemDropped: (item: string, fromSection: SectionName, toSection: SectionName) => void;
  handleItemRemoved: (item: string, fromSection: SectionName) => void;
  handleItemConfirmed: (item: string, section: SectionName) => void;

  // Feedback
  evaluationMode: boolean;
  sectionRatings: Record<SectionKey, SectionRating>;
  handleRating: (section: string, rating: "ok" | "partial" | "bad" | "hce_bad") => void;

  // Modal openers
  setNotasAltaModalOpen: (v: boolean) => void;
  setFarmacologiaModalOpen: (v: boolean) => void;
  setLaboratorioModalOpen: (v: boolean) => void;
}

export default function StudiesProceduresCard({
  estudiosText, setEstudiosText,
  procedimientosText, setProcedimientosText,
  interconsultasText, setInterconsultasText,
  indicacionesAltaText, setIndicacionesAltaText,
  editingEstudios, setEditingEstudios,
  editingProc, setEditingProc,
  editingInter, setEditingInter,
  editingIndAlta, setEditingIndAlta,
  onSave, pacienteFallecido,
  handleSectionItemsChange, handleItemDropped, handleItemRemoved, handleItemConfirmed,
  evaluationMode, sectionRatings, handleRating,
  setNotasAltaModalOpen, setFarmacologiaModalOpen, setLaboratorioModalOpen,
}: StudiesProceduresCardProps) {
  return (
    <div className="card card-gen card-terapeutica">
      <div className="section-header">
        <h3>Estudios, Procedimientos e Interconsultas</h3>
      </div>

      {/* ESTUDIOS */}
      <div className="gen-block">
        <div className="gen-header-row">
          <div className="gen-key">Estudios</div>
          <div className="gen-header-actions">
            <FeedbackButtons
              section="estudios"
              evaluationMode={evaluationMode}
              sectionRatings={sectionRatings}
              handleRating={handleRating}
            />
            {!editingEstudios && (
              <button type="button" className="icon-btn" title="Editar seccion" onClick={() => setEditingEstudios(true)}>
                <FaPen />
              </button>
            )}
            {editingEstudios && (
              <button type="button" className="icon-btn" title="Confirmar edicion" onClick={() => { onSave(); setEditingEstudios(false); }}>
                <FaSave />
              </button>
            )}
          </div>
        </div>
        {editingEstudios ? (
          <textarea
            className="gen-textarea"
            value={estudiosText}
            onChange={(e) => setEstudiosText(e.target.value)}
            placeholder="DD/MM/YYYY - Nombre del estudio"
          />
        ) : (
          <DraggableSectionList
            sectionName="estudios"
            items={multilineToArray(estudiosText)}
            onItemsChange={(items) => handleSectionItemsChange("estudios", items)}
            onItemDropped={handleItemDropped}
            onItemRemoved={handleItemRemoved}
            onItemConfirmed={handleItemConfirmed}
          />
        )}
      </div>

      {/* PROCEDIMIENTOS */}
      <div className="gen-block">
        <div className="gen-header-row">
          <div className="gen-key">Procedimientos</div>
          <div className="gen-header-actions">
            <FeedbackButtons
              section="procedimientos"
              evaluationMode={evaluationMode}
              sectionRatings={sectionRatings}
              handleRating={handleRating}
            />
            {!editingProc && (
              <button type="button" className="icon-btn" title="Editar seccion" onClick={() => setEditingProc(true)}>
                <FaPen />
              </button>
            )}
            {editingProc && (
              <button type="button" className="icon-btn" title="Confirmar edicion" onClick={() => { onSave(); setEditingProc(false); }}>
                <FaSave />
              </button>
            )}
          </div>
        </div>
        {editingProc ? (
          <textarea
            className="gen-textarea"
            value={procedimientosText}
            onChange={(e) => setProcedimientosText(e.target.value)}
          />
        ) : (
          <DraggableSectionList
            sectionName="procedimientos"
            items={multilineToArray(procedimientosText)}
            onItemsChange={(items) => handleSectionItemsChange("procedimientos", items)}
            onItemDropped={handleItemDropped}
            onItemRemoved={handleItemRemoved}
            onItemConfirmed={handleItemConfirmed}
          />
        )}
      </div>

      {/* INTERCONSULTAS */}
      <div className="gen-block">
        <div className="gen-header-row">
          <div className="gen-key">Interconsultas</div>
          <div className="gen-header-actions">
            <FeedbackButtons
              section="interconsultas"
              evaluationMode={evaluationMode}
              sectionRatings={sectionRatings}
              handleRating={handleRating}
            />
            {!editingInter && (
              <button type="button" className="icon-btn" title="Editar seccion" onClick={() => setEditingInter(true)}>
                <FaPen />
              </button>
            )}
            {editingInter && (
              <button type="button" className="icon-btn" title="Confirmar edicion" onClick={() => { onSave(); setEditingInter(false); }}>
                <FaSave />
              </button>
            )}
          </div>
        </div>
        {editingInter ? (
          <textarea
            className="gen-textarea"
            value={interconsultasText}
            onChange={(e) => setInterconsultasText(e.target.value)}
          />
        ) : (
          <DraggableSectionList
            sectionName="interconsultas"
            items={multilineToArray(interconsultasText)}
            onItemsChange={(items) => handleSectionItemsChange("interconsultas", items)}
            onItemDropped={handleItemDropped}
            onItemRemoved={handleItemRemoved}
            onItemConfirmed={handleItemConfirmed}
          />
        )}
      </div>

      {/* INDICACIONES DE ALTA */}
      <div className="gen-block">
        <div className="gen-header-row">
          <div className="gen-key">Indicaciones de alta <span className="section-tag editable">Lo Completa el Medico</span></div>
          <div className="gen-header-actions">
            {!editingIndAlta && (
              <button type="button" className="icon-btn" title="Editar seccion" onClick={() => setEditingIndAlta(true)}>
                <FaPen />
              </button>
            )}
            {editingIndAlta && (
              <button type="button" className="icon-btn" title="Confirmar edicion" onClick={() => { onSave(); setEditingIndAlta(false); }}>
                <FaSave />
              </button>
            )}
            {!pacienteFallecido && (
              <button
                type="button"
                className="icon-btn btn-notas-alta"
                title="Ver/Editar Recomendaciones al Alta"
                onClick={() => setNotasAltaModalOpen(true)}
              >
                {"\ud83d\udcdd"}
              </button>
            )}
          </div>
        </div>
        {editingIndAlta ? (
          <textarea
            className="gen-textarea"
            value={indicacionesAltaText}
            onChange={(e) => setIndicacionesAltaText(e.target.value)}
          />
        ) : (
          <div className="gen-text-readonly">
            {indicacionesAltaText.trim()
              ? indicacionesAltaText.split(/\r?\n/).map((t, i) => <div key={i}>{"\u2022"} {t}</div>)
              : "\u2014"}
          </div>
        )}
      </div>

      {/* OTROS DATOS DE INTERES */}
      {!pacienteFallecido && (
        <div className="otros-datos-interes">
          <h4>Otros Datos de Interes</h4>
          <div className="otros-datos-buttons">
            <button
              type="button"
              className="btn-otros-datos btn-farmacologia"
              onClick={() => setFarmacologiaModalOpen(true)}
            >
              <span className="btn-icon">{"\ud83d\udc8a"}</span>
              <span className="btn-label">Farmacologia</span>
            </button>
            <button
              type="button"
              className="btn-otros-datos btn-laboratorio"
              onClick={() => setLaboratorioModalOpen(true)}
            >
              <span className="btn-icon">{"\ud83e\uddea"}</span>
              <span className="btn-label">Determinaciones Laboratorio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
