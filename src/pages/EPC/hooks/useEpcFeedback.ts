// src/pages/EPC/hooks/useEpcFeedback.ts
// Evaluation mode, section ratings, and feedback submission

import { useState, useMemo } from "react";
import api from "@/api/axios";
import type { EPC, SectionKey, SectionRating } from "@/types/epc";
import { SECTION_LABELS } from "@/types/epc";

export interface FeedbackQuestions {
  hasOmissions: boolean | null;
  hasRepetitions: boolean | null;
  isConfusing: boolean | null;
}

export interface FeedbackModalState {
  open: boolean;
  section: SectionKey | null;
  rating: SectionRating;
}

export interface PreviousEvaluation {
  has_previous: boolean;
  evaluated_at: string | null;
  evaluator_name: string | null;
}

export interface UseEpcFeedbackArgs {
  epc: EPC | null;
  motivoText: string;
  evolucionText: string;
  estudiosText: string;
  procedimientosText: string;
  interconsultasText: string;
  tratamientoText: string;
  indicacionesAltaText: string;
  recomendacionesText: string;
  setToastOk: (v: string | null) => void;
  setToastErr: (v: string | null) => void;
}

export interface EpcFeedbackState {
  evaluationMode: boolean;
  evalValidationError: string | null;
  previousEvaluation: PreviousEvaluation | null;
  loadingPreviousEval: boolean;
  sectionRatings: Record<SectionKey, SectionRating>;
  feedbackModal: FeedbackModalState;
  feedbackText: string;
  setFeedbackText: (v: string) => void;
  feedbackQuestions: FeedbackQuestions;
  setFeedbackQuestions: (v: FeedbackQuestions | ((prev: FeedbackQuestions) => FeedbackQuestions)) => void;
  submittingFeedback: boolean;
  allSectionsRated: boolean;
  allQuestionsAnswered: boolean;
  feedbackTextValid: boolean;
  MIN_FEEDBACK_LENGTH: number;

  toggleEvaluationMode: () => void;
  saveEvaluation: () => Promise<void>;
  handleRating: (section: string, rating: "ok" | "partial" | "bad" | "hce_bad") => void;
  confirmFeedback: () => void;
  cancelFeedback: () => void;
  getVisibleSections: () => SectionKey[];
  getUnratedSections: () => string[];
  setEvaluationMode: (v: boolean) => void;
  setEvalValidationError: (v: string | null) => void;
}

const INITIAL_RATINGS: Record<SectionKey, SectionRating> = {
  motivo: null,
  evolucion: null,
  estudios: null,
  procedimientos: null,
  interconsultas: null,
  tratamiento: null,
  indicaciones: null,
  recomendaciones: null,
};

const MIN_FEEDBACK_LENGTH = 30;

export function useEpcFeedback(args: UseEpcFeedbackArgs): EpcFeedbackState {
  const {
    epc, motivoText, evolucionText, estudiosText, procedimientosText,
    interconsultasText, tratamientoText, indicacionesAltaText, recomendacionesText,
    setToastOk, setToastErr,
  } = args;

  const [evaluationMode, setEvaluationMode] = useState(false);
  const [evalValidationError, setEvalValidationError] = useState<string | null>(null);
  const [sectionRatings, setSectionRatings] = useState<Record<SectionKey, SectionRating>>({ ...INITIAL_RATINGS });

  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    open: false, section: null, rating: null,
  });
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackQuestions, setFeedbackQuestions] = useState<FeedbackQuestions>({
    hasOmissions: null, hasRepetitions: null, isConfusing: null,
  });

  const [previousEvaluation, setPreviousEvaluation] = useState<PreviousEvaluation | null>(null);
  const [loadingPreviousEval, setLoadingPreviousEval] = useState(false);

  // Section API mapping
  const sectionApiMap: Record<string, { apiName: string; getContent: () => string }> = {
    motivo: { apiName: "motivo_internacion", getContent: () => motivoText },
    evolucion: { apiName: "evolucion", getContent: () => evolucionText },
    estudios: { apiName: "estudios", getContent: () => estudiosText },
    procedimientos: { apiName: "procedimientos", getContent: () => procedimientosText },
    interconsultas: { apiName: "interconsultas", getContent: () => interconsultasText },
    tratamiento: { apiName: "medicacion", getContent: () => tratamientoText },
    indicaciones: { apiName: "indicaciones_alta", getContent: () => indicacionesAltaText },
    recomendaciones: { apiName: "recomendaciones", getContent: () => recomendacionesText },
  };

  function getVisibleSections(): SectionKey[] {
    return ["motivo", "evolucion", "estudios", "procedimientos", "interconsultas"];
  }

  function getUnratedSections(): string[] {
    const visible = getVisibleSections();
    return visible
      .filter((key) => sectionRatings[key] === null)
      .map((key) => SECTION_LABELS[key]);
  }

  const allSectionsRated = getUnratedSections().length === 0;
  const allQuestionsAnswered =
    feedbackQuestions.hasOmissions !== null &&
    feedbackQuestions.hasRepetitions !== null &&
    feedbackQuestions.isConfusing !== null;
  const feedbackTextValid = feedbackText.trim().length >= MIN_FEEDBACK_LENGTH;



  function toggleEvaluationMode() {
    if (!evaluationMode) {
      setEvaluationMode(true);
      setSectionRatings({ ...INITIAL_RATINGS });
    } else {
      setEvaluationMode(false);
      setEvalValidationError(null);
      setSectionRatings({ ...INITIAL_RATINGS });
    }
  }

  async function saveEvaluation() {
    const unrated = getUnratedSections();
    if (unrated.length > 0) {
      setEvalValidationError(`Debes evaluar TODAS las secciones visibles. Faltan: ${unrated.join(", ")}`);
      return;
    }
    setEvalValidationError(null);
    try {
      await api.post(`/epc/${epc!.id}/feedback/complete`);
      setToastOk("Evaluacion guardada correctamente.");
    } catch (err) {
      console.error("Error guardando evaluacion:", err);
      setToastErr("Error al guardar la evaluacion.");
    }
    setEvaluationMode(false);
  }

  async function submitFeedbackToApi(
    section: string,
    rating: string,
    text: string,
    questions?: FeedbackQuestions
  ) {
    if (!epc) return;
    try {
      await api.post(`/epc/${epc.id}/feedback`, {
        section: sectionApiMap[section]?.apiName || section,
        rating,
        feedback_text: text || null,
        original_content: sectionApiMap[section]?.getContent() || "",
        has_omissions: questions?.hasOmissions ?? null,
        has_repetitions: questions?.hasRepetitions ?? null,
        is_confusing: questions?.isConfusing ?? null,
      });
    } catch (e) {
      console.error("Error enviando feedback:", e);
    }
  }

  function handleRating(section: string, rating: "ok" | "partial" | "bad" | "hce_bad") {
    if (rating === "ok" || rating === "hce_bad") {
      submitFeedbackToApi(section, rating, "");
      setSectionRatings((prev) => ({ ...prev, [section]: rating }));
    } else {
      setFeedbackModal({ open: true, section: section as SectionKey, rating });
      setFeedbackText("");
      setFeedbackQuestions({ hasOmissions: null, hasRepetitions: null, isConfusing: null });
    }
  }

  function confirmFeedback() {
    if (!feedbackModal.section || !feedbackTextValid || !allQuestionsAnswered) return;

    setSubmittingFeedback(true);
    submitFeedbackToApi(
      feedbackModal.section,
      feedbackModal.rating || "partial",
      feedbackText,
      feedbackQuestions
    )
      .then(() => {
        setSectionRatings((prev) => ({ ...prev, [feedbackModal.section!]: feedbackModal.rating }));
        setFeedbackModal({ open: false, section: null, rating: null });
        setFeedbackText("");
        setFeedbackQuestions({ hasOmissions: null, hasRepetitions: null, isConfusing: null });
        setToastOk("Feedback enviado correctamente");
      })
      .finally(() => setSubmittingFeedback(false));
  }

  function cancelFeedback() {
    setFeedbackModal({ open: false, section: null, rating: null });
    setFeedbackText("");
    setFeedbackQuestions({ hasOmissions: null, hasRepetitions: null, isConfusing: null });
  }

  return {
    evaluationMode,
    evalValidationError,
    previousEvaluation,
    loadingPreviousEval,
    sectionRatings,
    feedbackModal,
    feedbackText,
    setFeedbackText,
    feedbackQuestions,
    setFeedbackQuestions,
    submittingFeedback,
    allSectionsRated,
    allQuestionsAnswered,
    feedbackTextValid,
    MIN_FEEDBACK_LENGTH,

    toggleEvaluationMode,
    saveEvaluation,
    handleRating,
    confirmFeedback,
    cancelFeedback,
    getVisibleSections,
    getUnratedSections,
    setEvaluationMode,
    setEvalValidationError,
  };
}
