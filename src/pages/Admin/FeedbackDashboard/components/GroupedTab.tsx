// src/pages/Admin/FeedbackDashboard/components/GroupedTab.tsx
import {
    FaThumbsUp,
    FaThumbsDown,
    FaMeh,
    FaFileMedical,
    FaChevronDown,
    FaChevronRight,
    FaTrash,
    FaUserMd,
    FaSortAmountDown,
    FaSortAmountUpAlt,
    FaSearch,
} from "react-icons/fa";
import type { GroupedEPC } from "@/types/feedback";
import { SECTION_LABELS, formatDate } from "../constants";

type GroupedTabProps = {
    loadingGrouped: boolean;
    sortedGroupedData: GroupedEPC[];
    searchGrouped: string;
    setSearchGrouped: (v: string) => void;
    sortDirection: "asc" | "desc";
    setSortDirection: (fn: (d: "asc" | "desc") => "asc" | "desc") => void;
    expandedEpcs: Set<string>;
    expandedTexts: Set<string>;
    deletingEvaluator: string | null;
    toggleEpcExpand: (epcId: string) => void;
    toggleTextExpand: (key: string) => void;
    deleteEvaluatorFeedback: (epcId: string, evaluatorId: string, evaluatorName: string) => void;
};

export default function GroupedTab({
    loadingGrouped,
    sortedGroupedData,
    searchGrouped,
    setSearchGrouped,
    sortDirection,
    setSortDirection,
    expandedEpcs,
    expandedTexts,
    deletingEvaluator,
    toggleEpcExpand,
    toggleTextExpand,
    deleteEvaluatorFeedback,
}: GroupedTabProps) {
    return (
        <div className="fb-grouped-view">
            {/* Controles de ordenamiento */}
            <div className="fb-grouped-controls">
                <div className="fb-search-wrap">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Buscar por paciente..."
                        value={searchGrouped}
                        onChange={e => setSearchGrouped(e.target.value)}
                        className="fb-search-input"
                    />
                </div>
                <button
                    className="fb-sort-btn"
                    onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
                    title={sortDirection === "asc" ? "Ordenado A-Z (más antiguo primero)" : "Ordenado Z-A (más reciente primero)"}
                >
                    {sortDirection === "asc" ? <FaSortAmountDown /> : <FaSortAmountUpAlt />}
                    <span>Fecha creación: {sortDirection === "asc" ? "A-Z" : "Z-A"}</span>
                </button>
            </div>

            {loadingGrouped && <div className="fb-loading">Cargando feedbacks agrupados...</div>}

            {!loadingGrouped && sortedGroupedData.length === 0 && (
                <div className="fb-empty-grouped">
                    No hay feedbacks registrados aún.
                </div>
            )}

            {!loadingGrouped && sortedGroupedData.map((epc) => (
                <div key={epc.epc_id} className="fb-epc-card">
                    <div
                        className="fb-epc-header"
                        onClick={() => toggleEpcExpand(epc.epc_id)}
                    >
                        <div className="fb-epc-toggle">
                            {expandedEpcs.has(epc.epc_id) ? <FaChevronDown /> : <FaChevronRight />}
                        </div>
                        <div className="fb-epc-icon">
                            <FaFileMedical />
                        </div>
                        <div className="fb-epc-info">
                            <div className="fb-epc-title">
                                Paciente: <strong>{epc.patient_name || epc.patient_id || "—"}</strong>
                            </div>
                            <div className="fb-epc-meta">
                                <span>EPC: {epc.epc_id.slice(0, 8)}...</span>
                                {epc.hce_origin_id && <span>HCE: {epc.hce_origin_id.slice(0, 8)}...</span>}
                                {epc.epc_created_at && <span>Creada: {formatDate(epc.epc_created_at)}</span>}
                            </div>
                        </div>
                        <div className="fb-epc-stats">
                            <span className="fb-epc-eval-count">
                                {epc.total_sections_evaluated} evaluaciones
                            </span>
                            <span className="fb-epc-evaluators">
                                {epc.evaluators.length} evaluador{epc.evaluators.length !== 1 ? "es" : ""}
                            </span>
                        </div>
                    </div>

                    {expandedEpcs.has(epc.epc_id) && (
                        <div className="fb-epc-body">
                            {epc.evaluators.map((evaluator, idx) => (
                                <div key={idx} className="fb-evaluator-block">
                                    <div className="fb-evaluator-header">
                                        <FaUserMd />
                                        <span className="fb-evaluator-name">{evaluator.evaluator_name}</span>
                                        <span className="fb-evaluator-date">{formatDate(evaluator.evaluated_at)}</span>
                                        <button
                                            className="fb-delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteEvaluatorFeedback(epc.epc_id, evaluator.evaluator_id, evaluator.evaluator_name);
                                            }}
                                            disabled={deletingEvaluator === `${epc.epc_id}_${evaluator.evaluator_id}`}
                                            title="Eliminar evaluaciones de este evaluador"
                                        >
                                            {deletingEvaluator === `${epc.epc_id}_${evaluator.evaluator_id}`
                                                ? "..."
                                                : <FaTrash />
                                            }
                                        </button>
                                    </div>
                                    <div className="fb-evaluator-sections">
                                        {evaluator.sections.map((sec, secIdx) => {
                                            const textKey = `${epc.epc_id}_${evaluator.evaluator_id}_${secIdx}`;
                                            const isExpanded = expandedTexts.has(textKey);

                                            return (
                                                <div key={secIdx} className="fb-section-item">
                                                    <span className={`fb-rating-badge ${sec.rating}`}>
                                                        {sec.rating === "ok" && <FaThumbsUp />}
                                                        {sec.rating === "partial" && <FaMeh />}
                                                        {sec.rating === "bad" && <FaThumbsDown />}
                                                    </span>
                                                    <span className="fb-section-name">
                                                        {SECTION_LABELS[sec.section] || sec.section}
                                                    </span>
                                                    {/* Indicadores de preguntas */}
                                                    {(sec.rating === "partial" || sec.rating === "bad") && (
                                                        <div className="fb-question-tags">
                                                            {sec.has_omissions && <span className="fb-qtag omissions" title="Tiene omisiones">Omisiones</span>}
                                                            {sec.has_repetitions && <span className="fb-qtag repetitions" title="Tiene repeticiones">Repeticiones</span>}
                                                            {sec.is_confusing && <span className="fb-qtag confusing" title="Es confuso o erróneo">Confuso</span>}
                                                        </div>
                                                    )}
                                                    {sec.feedback_text && (
                                                        <span
                                                            className={`fb-section-text ${isExpanded ? "expanded" : ""}`}
                                                            onClick={() => toggleTextExpand(textKey)}
                                                            title={isExpanded ? "Click para contraer" : "Click para ver completo"}
                                                        >
                                                            "{sec.feedback_text}"
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
