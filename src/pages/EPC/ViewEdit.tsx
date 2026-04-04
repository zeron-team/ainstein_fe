// src/pages/EPC/ViewEdit.tsx
// Orchestrator: imports hooks and renders subcomponents

import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { FaBookMedical, FaBrain } from "react-icons/fa";
import api from "@/api/axios";

import "./ViewEditEPC.css";

// Hooks
import { useEpcContext } from "./hooks/useEpcContext";
import { useEpcForm } from "./hooks/useEpcForm";
import { useEpcFeedback } from "./hooks/useEpcFeedback";
import { useEpcExport } from "./hooks/useEpcExport";
import { useEpcCorrections } from "./hooks/useEpcCorrections";

// Components
import EPCHeader from "./components/EPCHeader";
import EPCFormCard from "./components/EPCFormCard";
import ClinicalDataCard from "./components/ClinicalDataCard";
import MotivoEvolucionCard from "./components/MotivoEvolucionCard";
import StudiesProceduresCard from "./components/StudiesProceduresCard";
import CorrectionsTab from "./components/CorrectionsTab";
import HistoryTab from "./components/HistoryTab";
import { BrainProgress } from "@/components/BrainProgress";

// Modals
import FeedbackModal from "./components/modals/FeedbackModal";
import HceViewerModal from "./components/modals/HceViewerModal";
import AltaAssistantModal from "./components/modals/AltaAssistantModal";
import FarmacologiaModal from "./components/modals/FarmacologiaModal";
import LaboratorioModal from "./components/modals/LaboratorioModal";
import LabDetailModal from "./components/modals/LabDetailModal";

export default function ViewEditEPC() {
  const { id } = useParams<{ id: string }>();

  // ── Data loading & context ──
  const ctx = useEpcContext(id);

  // ── Form state & save logic ──
  const form = useEpcForm({
    epc: ctx.epc,
    generated: ctx.generated,
    titulo: ctx.titulo,
    cie10: ctx.cie10,
    fechaEmision: ctx.fechaEmision,
    firmado: ctx.firmado,
    medicoNombre: ctx.medicoNombre,
    motivoText: ctx.motivoText,
    evolucionText: ctx.evolucionText,
    estudiosText: ctx.estudiosText,
    procedimientosText: ctx.procedimientosText,
    interconsultasText: ctx.interconsultasText,
    tratamientoText: ctx.tratamientoText,
    indicacionesAltaText: ctx.indicacionesAltaText,
    recomendacionesText: ctx.recomendacionesText,
    loadContext: ctx.loadContext,
    setResetEditingFlags: ctx.setResetEditingFlags,
  });

  // ── Feedback / evaluation mode ──
  const feedback = useEpcFeedback({
    epc: ctx.epc,
    motivoText: ctx.motivoText,
    evolucionText: ctx.evolucionText,
    estudiosText: ctx.estudiosText,
    procedimientosText: ctx.procedimientosText,
    interconsultasText: ctx.interconsultasText,
    tratamientoText: ctx.tratamientoText,
    indicacionesAltaText: ctx.indicacionesAltaText,
    recomendacionesText: ctx.recomendacionesText,
    setToastOk: form.setToastOk,
    setToastErr: form.setToastErr,
  });

  // ── Corrections / drag-drop ──
  const corrections = useEpcCorrections({
    id,
    estudiosText: ctx.estudiosText,
    procedimientosText: ctx.procedimientosText,
    interconsultasText: ctx.interconsultasText,
    setEstudiosText: ctx.setEstudiosText,
    setProcedimientosText: ctx.setProcedimientosText,
    setInterconsultasText: ctx.setInterconsultasText,
    onSave: form.onSave,
  });

  // ── Export / print / download ──
  const [selectedLabsForPdf, setSelectedLabsForPdf] = useState<Set<string>>(new Set());

  const exportActions = useEpcExport({
    epc: ctx.epc,
    generated: ctx.generated,
    motivoText: ctx.motivoText,
    evolucionText: ctx.evolucionText,
    estudiosText: ctx.estudiosText,
    procedimientosText: ctx.procedimientosText,
    interconsultasText: ctx.interconsultasText,
    tratamientoText: ctx.tratamientoText,
    indicacionesAltaText: ctx.indicacionesAltaText,
    recomendacionesText: ctx.recomendacionesText,
    selectedLabsForPdf,
    setToastOk: form.setToastOk,
    setToastErr: form.setToastErr,
  });

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState<"epc" | "history" | "corrections">("epc");

  // ── Modal state ──
  const [notasAltaModalOpen, setNotasAltaModalOpen] = useState(false);
  const [farmacologiaModalOpen, setFarmacologiaModalOpen] = useState(false);
  const [laboratorioModalOpen, setLaboratorioModalOpen] = useState(false);
  const [labDetailModal, setLabDetailModal] = useState<{ open: boolean; fecha: string; detalle: string }>({
    open: false, fecha: "", detalle: "",
  });
  const [hceModalOpen, setHceModalOpen] = useState(false);
  const [hceModalText, setHceModalText] = useState("");
  const [hceModalLoading, setHceModalLoading] = useState(false);
  const [hceModalRegistros, setHceModalRegistros] = useState(0);

  // ── Derived state ──
  const pacienteFallecido = useMemo(() => {
    const texto = ctx.evolucionText.toLowerCase();
    const palabrasClave = ["óbito", "obito", "falleció", "fallecio", "murió", "murio", "defunción", "defuncion", "fallecimiento", "deceso"];
    return palabrasClave.some(palabra => texto.includes(palabra));
  }, [ctx.evolucionText]);

  // ── Doctor change handler ──
  function onDoctorChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    ctx.setMedicoId(val);
    const doc = ctx.doctors.find((d) => d.id === val);
    ctx.setMedicoNombre(doc ? doc.full_name : "");
  }

  // ── HCE modal handler ──
  async function openHceModal() {
    const hceId = ctx.generated?.hce_source_id;
    if (!hceId) {
      form.setToastErr("No hay HCE origen asociada a esta EPC.");
      setTimeout(() => form.setToastErr(null), 3000);
      return;
    }
    setHceModalOpen(true);
    setHceModalLoading(true);
    setHceModalText("");
    try {
      const { data } = await api.get(`/hce/${hceId}/readable`);
      setHceModalText(data.text || "Sin contenido.");
      setHceModalRegistros(data.registros || 0);
    } catch (err: any) {
      setHceModalText("Error al cargar la HCE: " + (err?.response?.data?.detail || err.message));
    } finally {
      setHceModalLoading(false);
    }
  }

  // ── Early returns ──
  if (ctx.loading) return <div className="epc-wrap">Cargando Epicrisis\u2026</div>;
  if (ctx.errMsg)
    return (
      <div className="epc-wrap">
        <div className="toast err">{ctx.errMsg}</div>
      </div>
    );
  if (!ctx.epc) return null;

  return (
    <div className="epc-wrap">
      {/* Header */}
      <EPCHeader
        epc={ctx.epc}
        patient={ctx.patient}
        demographics={ctx.demographics}
        generated={ctx.generated}
        history={ctx.history}
        medicoNombre={ctx.medicoNombre}
        fechaEmision={ctx.fechaEmision}
        firmado={ctx.firmado}
      />

      {/* Tabs */}
      <div className="tabs">
        <button
          type="button"
          className={`tab ${activeTab === "epc" ? "active" : ""}`}
          onClick={() => setActiveTab("epc")}
        >
          Epicrisis
        </button>
        <button
          type="button"
          className="tab tab-hce"
          title="Ver Historia Clinica Electronica"
          onClick={openHceModal}
        >
          <FaBookMedical /> Ver HCE
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Historial
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "corrections" ? "active" : ""}`}
          onClick={() => setActiveTab("corrections")}
        >
          Correcciones {corrections.localCorrections.length > 0 && <span className="corrections-badge">{corrections.localCorrections.length}</span>}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "epc" && (
        <div className="epc-layout">
          {/* Left column */}
          <div className="epc-column">
            <EPCFormCard
              epc={ctx.epc}
              doctors={ctx.doctors}
              titulo={ctx.titulo}
              setTitulo={ctx.setTitulo}
              fechaEmision={ctx.fechaEmision}
              setFechaEmision={ctx.setFechaEmision}
              firmado={ctx.firmado}
              setFirmado={ctx.setFirmado}
              medicoId={ctx.medicoId}
              onDoctorChange={onDoctorChange}
              generating={form.generating}
              saving={form.saving}
              isAnyEditing={form.isAnyEditing}
              onGenerate={form.onGenerate}
              onSave={form.onSave}
              onDownloadPdf={exportActions.onDownloadPdf}
              onPrint={exportActions.onPrint}
              evaluationMode={feedback.evaluationMode}
              toggleEvaluationMode={feedback.toggleEvaluationMode}
              setEvaluationMode={feedback.setEvaluationMode}
              setEvalValidationError={feedback.setEvalValidationError}
              saveEvaluation={feedback.saveEvaluation}
              allSectionsRated={feedback.allSectionsRated}
              getVisibleSections={feedback.getVisibleSections}
              getUnratedSections={feedback.getUnratedSections}
              evalValidationError={feedback.evalValidationError}
              previousEvaluation={feedback.previousEvaluation}
              loadingPreviousEval={feedback.loadingPreviousEval}
              toastOk={form.toastOk}
              toastErr={form.toastErr}
            />

            <MotivoEvolucionCard
              generated={ctx.generated}
              generating={form.generating}
              motivoText={ctx.motivoText}
              setMotivoText={ctx.setMotivoText}
              evolucionText={ctx.evolucionText}
              setEvolucionText={ctx.setEvolucionText}
              editingMotivo={form.editingMotivo}
              setEditingMotivo={form.setEditingMotivo}
              editingEvolucion={form.editingEvolucion}
              setEditingEvolucion={form.setEditingEvolucion}
              onSave={form.onSave}
              copyGenerated={exportActions.copyGenerated}
              downloadGenerated={exportActions.downloadGenerated}
              evaluationMode={feedback.evaluationMode}
              sectionRatings={feedback.sectionRatings}
              handleRating={feedback.handleRating}
            />
          </div>

          {/* Right column */}
          <div className="epc-column">
            <ClinicalDataCard
              nroHC={ctx.nroHC}
              setNroHC={ctx.setNroHC}
              admNum={ctx.admNum}
              setAdmNum={ctx.setAdmNum}
              protocolo={ctx.protocolo}
              setProtocolo={ctx.setProtocolo}
              fecIng={ctx.fecIng}
              setFecIng={ctx.setFecIng}
              fecEgr={ctx.fecEgr}
              setFecEgr={ctx.setFecEgr}
              sector={ctx.sector}
              setSector={ctx.setSector}
              hab={ctx.hab}
              setHab={ctx.setHab}
              cama={ctx.cama}
              setCama={ctx.setCama}
            />

            <StudiesProceduresCard
              estudiosText={ctx.estudiosText}
              setEstudiosText={ctx.setEstudiosText}
              procedimientosText={ctx.procedimientosText}
              setProcedimientosText={ctx.setProcedimientosText}
              interconsultasText={ctx.interconsultasText}
              setInterconsultasText={ctx.setInterconsultasText}
              indicacionesAltaText={ctx.indicacionesAltaText}
              setIndicacionesAltaText={ctx.setIndicacionesAltaText}
              editingEstudios={form.editingEstudios}
              setEditingEstudios={form.setEditingEstudios}
              editingProc={form.editingProc}
              setEditingProc={form.setEditingProc}
              editingInter={form.editingInter}
              setEditingInter={form.setEditingInter}
              editingIndAlta={form.editingIndAlta}
              setEditingIndAlta={form.setEditingIndAlta}
              onSave={form.onSave}
              pacienteFallecido={pacienteFallecido}
              handleSectionItemsChange={corrections.handleSectionItemsChange}
              handleItemDropped={corrections.handleItemDropped}
              handleItemRemoved={corrections.handleItemRemoved}
              handleItemConfirmed={corrections.handleItemConfirmed}
              evaluationMode={feedback.evaluationMode}
              sectionRatings={feedback.sectionRatings}
              handleRating={feedback.handleRating}
              setNotasAltaModalOpen={setNotasAltaModalOpen}
              setFarmacologiaModalOpen={setFarmacologiaModalOpen}
              setLaboratorioModalOpen={setLaboratorioModalOpen}
            />
          </div>
        </div>
      )}

      {activeTab === "corrections" && (
        <CorrectionsTab
          localCorrections={corrections.localCorrections}
          correctionsSummary={corrections.correctionsSummary}
        />
      )}

      {activeTab === "history" && (
        <HistoryTab history={ctx.history} />
      )}

      {/* Modals */}
      <FeedbackModal
        feedbackModal={feedback.feedbackModal}
        feedbackText={feedback.feedbackText}
        setFeedbackText={feedback.setFeedbackText}
        feedbackQuestions={feedback.feedbackQuestions}
        setFeedbackQuestions={feedback.setFeedbackQuestions}
        feedbackTextValid={feedback.feedbackTextValid}
        allQuestionsAnswered={feedback.allQuestionsAnswered}
        submittingFeedback={feedback.submittingFeedback}
        MIN_FEEDBACK_LENGTH={feedback.MIN_FEEDBACK_LENGTH}
        confirmFeedback={feedback.confirmFeedback}
        cancelFeedback={feedback.cancelFeedback}
      />

      <AltaAssistantModal
        open={notasAltaModalOpen}
        onClose={() => setNotasAltaModalOpen(false)}
        epc={ctx.epc}
        evolucionText={ctx.evolucionText}
        indicacionesAltaText={ctx.indicacionesAltaText}
        setIndicacionesAltaText={ctx.setIndicacionesAltaText}
        pacienteFallecido={pacienteFallecido}
      />

      <LabDetailModal
        open={labDetailModal.open}
        fecha={labDetailModal.fecha}
        detalle={labDetailModal.detalle}
        onClose={() => setLabDetailModal({ open: false, fecha: "", detalle: "" })}
        selectedLabsForPdf={selectedLabsForPdf}
        setSelectedLabsForPdf={setSelectedLabsForPdf}
        saveLabSelectionToEpc={exportActions.saveLabSelectionToEpc}
        saving={exportActions.savingLabSelection}
      />

      <FarmacologiaModal
        open={farmacologiaModalOpen}
        onClose={() => setFarmacologiaModalOpen(false)}
        medicacionData={ctx.medicacionData}
        tratamientoText={ctx.tratamientoText}
      />

      <LaboratorioModal
        open={laboratorioModalOpen}
        onClose={() => setLaboratorioModalOpen(false)}
        laboratoriosData={ctx.laboratoriosData}
      />

      <HceViewerModal
        open={hceModalOpen}
        onClose={() => setHceModalOpen(false)}
        loading={hceModalLoading}
        text={hceModalText}
        registros={hceModalRegistros}
        setToastOk={form.setToastOk}
      />

      {form.generating && (
        <BrainProgress />
      )}
    </div>
  );
}
