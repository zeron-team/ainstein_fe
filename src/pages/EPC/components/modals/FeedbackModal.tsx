// src/pages/EPC/components/modals/FeedbackModal.tsx
// Feedback submission modal with mandatory questions

import type { FeedbackModalState, FeedbackQuestions } from "../../hooks/useEpcFeedback";

interface FeedbackModalProps {
  feedbackModal: FeedbackModalState;
  feedbackText: string;
  setFeedbackText: (v: string) => void;
  feedbackQuestions: FeedbackQuestions;
  setFeedbackQuestions: (v: FeedbackQuestions | ((prev: FeedbackQuestions) => FeedbackQuestions)) => void;
  feedbackTextValid: boolean;
  allQuestionsAnswered: boolean;
  submittingFeedback: boolean;
  MIN_FEEDBACK_LENGTH: number;
  confirmFeedback: () => void;
  cancelFeedback: () => void;
}

export default function FeedbackModal({
  feedbackModal,
  feedbackText, setFeedbackText,
  feedbackQuestions, setFeedbackQuestions,
  feedbackTextValid, allQuestionsAnswered, submittingFeedback,
  MIN_FEEDBACK_LENGTH,
  confirmFeedback, cancelFeedback,
}: FeedbackModalProps) {
  if (!feedbackModal.open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>
            {feedbackModal.rating === "bad"
              ? "Seccion incorrecta"
              : "Seccion parcialmente correcta"}
          </h3>
        </div>
        <div className="modal-body">
          <p className="modal-intro">
            Responde las siguientes preguntas y agrega tus observaciones:
          </p>

          <div className="feedback-questions">
            <div className="fb-question">
              <span className="fb-question-label">Tiene omisiones?</span>
              <div className="fb-question-options">
                <button
                  className={`fb-option ${feedbackQuestions.hasOmissions === true ? "selected yes" : ""}`}
                  onClick={() => setFeedbackQuestions(prev => ({ ...prev, hasOmissions: true }))}
                >
                  Si
                </button>
                <button
                  className={`fb-option ${feedbackQuestions.hasOmissions === false ? "selected no" : ""}`}
                  onClick={() => setFeedbackQuestions(prev => ({ ...prev, hasOmissions: false }))}
                >
                  No
                </button>
              </div>
            </div>

            <div className="fb-question">
              <span className="fb-question-label">Tiene repeticiones/excedentes?</span>
              <div className="fb-question-options">
                <button
                  className={`fb-option ${feedbackQuestions.hasRepetitions === true ? "selected yes" : ""}`}
                  onClick={() => setFeedbackQuestions(prev => ({ ...prev, hasRepetitions: true }))}
                >
                  Si
                </button>
                <button
                  className={`fb-option ${feedbackQuestions.hasRepetitions === false ? "selected no" : ""}`}
                  onClick={() => setFeedbackQuestions(prev => ({ ...prev, hasRepetitions: false }))}
                >
                  No
                </button>
              </div>
            </div>

            <div className="fb-question">
              <span className="fb-question-label">Es confuso o erroneo?</span>
              <div className="fb-question-options">
                <button
                  className={`fb-option ${feedbackQuestions.isConfusing === true ? "selected yes" : ""}`}
                  onClick={() => setFeedbackQuestions(prev => ({ ...prev, isConfusing: true }))}
                >
                  Si
                </button>
                <button
                  className={`fb-option ${feedbackQuestions.isConfusing === false ? "selected no" : ""}`}
                  onClick={() => setFeedbackQuestions(prev => ({ ...prev, isConfusing: false }))}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          <textarea
            className="modal-textarea"
            placeholder="Describi que esta mal o que deberia mejorar (minimo 30 caracteres)..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={4}
            autoFocus
          />
          <div className="modal-char-count">
            {feedbackText.trim().length}/{MIN_FEEDBACK_LENGTH} caracteres minimo
            {feedbackTextValid && " \u2713"}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn ghost" onClick={cancelFeedback}>
            Cancelar
          </button>
          <button
            className="btn primary"
            onClick={confirmFeedback}
            disabled={!feedbackTextValid || !allQuestionsAnswered || submittingFeedback}
          >
            {submittingFeedback ? "Enviando..." : "Enviar feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}
