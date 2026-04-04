// src/pages/EPC/components/FeedbackButtons.tsx
// Reusable feedback rating buttons (thumbs up/meh/down + optional HCE bad)

import { FaThumbsUp, FaMeh, FaThumbsDown } from "react-icons/fa";
import type { SectionKey, SectionRating } from "@/types/epc";

interface FeedbackButtonsProps {
  section: string;
  evaluationMode: boolean;
  sectionRatings: Record<SectionKey, SectionRating>;
  handleRating: (section: string, rating: "ok" | "partial" | "bad" | "hce_bad") => void;
  showHceBad?: boolean;
}

export default function FeedbackButtons({
  section,
  evaluationMode,
  sectionRatings,
  handleRating,
  showHceBad = false,
}: FeedbackButtonsProps) {
  if (!evaluationMode) return null;

  const currentRating = sectionRatings[section as keyof typeof sectionRatings];
  const isRated = currentRating !== null;

  return (
    <div className="feedback-icons">
      {showHceBad && (
        <button
          type="button"
          className={`fb-btn hce_bad ${currentRating === "hce_bad" ? "active" : ""}`}
          title="HCE - Problema en Historia Clínica"
          onClick={() => handleRating(section, "hce_bad")}
          disabled={isRated && currentRating !== "hce_bad"}
        >
          <span className="hce-bad-label">HCE</span>
          <FaThumbsDown className="hce-bad-icon" />
        </button>
      )}
      <button
        type="button"
        className={`fb-btn ok ${currentRating === "ok" ? "active" : ""}`}
        title="OK - Correcto"
        onClick={() => handleRating(section, "ok")}
        disabled={isRated && currentRating !== "ok"}
      >
        <FaThumbsUp />
      </button>
      <button
        type="button"
        className={`fb-btn partial ${currentRating === "partial" ? "active" : ""}`}
        title="A medias - Funciona parcialmente"
        onClick={() => handleRating(section, "partial")}
        disabled={isRated && currentRating !== "partial"}
      >
        <FaMeh />
      </button>
      <button
        type="button"
        className={`fb-btn bad ${currentRating === "bad" ? "active" : ""}`}
        title="Mal - Seccion incorrecta"
        onClick={() => handleRating(section, "bad")}
        disabled={isRated && currentRating !== "bad"}
      >
        <FaThumbsDown />
      </button>
    </div>
  );
}
