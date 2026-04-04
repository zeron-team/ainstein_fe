import { useState } from "react";
import {
    FaThumbsUp,
    FaThumbsDown,
    FaMeh,
    FaChevronDown,
    FaChevronRight,
    FaBrain,
    FaCheck,
    FaComment,
    FaExclamationTriangle,
    FaCheckCircle,
} from "react-icons/fa";
import type { InsightsData } from "@/types/feedback";
import type { LearningStats } from "../hooks/useFeedbackLearning";
import { formatDate } from "../constants";

type LearningTabProps = {
    loadingInsights: boolean;
    insightsData: InsightsData | null;
    learningStats: LearningStats | null;
    expandedLearningSections: Set<string>;
    toggleLearningSection: (sectionKey: string, type: "problems" | "rules") => void;
    onForceRefresh: () => void;
};

export default function LearningTab({
    loadingInsights,
    insightsData,
    learningStats,
    expandedLearningSections,
    toggleLearningSection,
    onForceRefresh,
}: LearningTabProps) {
    const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null);

    const sections = insightsData?.sections || [];
    const currentSection = activeSectionKey 
        ? sections.find(s => s.key === activeSectionKey) || sections[0]
        : sections[0];

    return (
        <div className="fb-learning-wrap">
            {loadingInsights ? (
                <div className="fb-loading-brain">
                    <FaBrain className="fb-brain-icon-loading" />
                    <div className="fb-loading-text">Analizando feedback con IA...</div>
                    <div className="fb-progress-bar">
                        <div className="fb-progress-fill"></div>
                    </div>
                    <div className="fb-loading-hint">Generando insights y reglas de aprendizaje</div>
                </div>
            ) : !insightsData ? (
                <div className="fb-empty">No hay datos de aprendizaje disponibles</div>
            ) : (
                <>
                    {/* Header con resumen */}
                    <div className="fb-learning-header">
                        <div className="fb-learning-summary">
                            <FaBrain className="fb-learning-icon" />
                            <div>
                                <h2>Reglas de Aprendizaje Continuo</h2>
                                <p>
                                    Basado en <b>{learningStats?.summary?.total_feedbacks_processed || insightsData.total_feedbacks_analyzed}</b> evaluaciones procesadas.
                                    {insightsData.computed_at && (
                                        <span className="fb-learning-date">
                                            {" "}• Actualizado: {formatDate(insightsData.computed_at)}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Cards de estadísticas de aprendizaje */}
                        {learningStats && (
                            <div className="fb-learning-stats-cards">
                                <div className="fb-ls-card">
                                    <div className="fb-ls-number">{learningStats.summary.total_analyses}</div>
                                    <div className="fb-ls-label">Análisis ejecutados</div>
                                </div>
                                <div className="fb-ls-card">
                                    <div className="fb-ls-number problems">{learningStats.summary.total_problems_detected}</div>
                                    <div className="fb-ls-label">Problemas detectados</div>
                                </div>
                                <div className="fb-ls-card">
                                    <div className="fb-ls-number rules">{learningStats.summary.total_rules_generated}</div>
                                    <div className="fb-ls-label">Reglas generadas</div>
                                </div>
                                <div className="fb-ls-card">
                                    <div className="fb-ls-number">{learningStats.summary.total_feedbacks_processed}</div>
                                    <div className="fb-ls-label">Feedbacks procesados</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sub-tabs por sección */}
                    {sections.length > 0 && (
                        <div className="fb-learning-subtabs">
                            {sections.map(section => (
                                <button
                                    key={section.key}
                                    className={`fb-learning-subtab ${currentSection?.key === section.key ? "active" : ""}`}
                                    onClick={() => setActiveSectionKey(section.key)}
                                >
                                    {section.name}
                                    {section.stats?.negative_pct > 50 && <span className="fb-badge-warning" title="Alta tasa de problemas" style={{marginLeft: "6px"}}>⚠️</span>}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Cards por sección (solo mostramos la activa) */}
                    <div className="fb-learning-grid">
                        {currentSection && [currentSection].map((section) => (
                            <div
                                key={section.key}
                                className={`fb-learning-card ${section.stats.negative_pct > 50 ? "problematic" : section.stats.ok_pct > 70 ? "good" : ""}`}
                            >
                                {/* Header con stats */}
                                <div className="fb-learning-card-header">
                                    <h3>{section.name}</h3>
                                    <div className="fb-learning-ratings">
                                        <span className="fb-rating-item ok">
                                            <FaThumbsUp /> {section.stats.ok_pct}%
                                        </span>
                                        <span className="fb-rating-item partial">
                                            <FaMeh /> {Math.round(section.stats.partial / section.stats.total * 100) || 0}%
                                        </span>
                                        <span className="fb-rating-item bad">
                                            <FaThumbsDown /> {Math.round(section.stats.bad / section.stats.total * 100) || 0}%
                                        </span>
                                        <span className="fb-rating-total">({section.stats.total} eval.)</span>
                                    </div>

                                    {/* Badges de las 3 preguntas */}
                                    {section.questions_stats && (
                                        (section.questions_stats.omissions > 0 ||
                                            section.questions_stats.repetitions > 0 ||
                                            section.questions_stats.confusing > 0) && (
                                            <div className="fb-questions-badges">
                                                {section.questions_stats.omissions > 0 && (
                                                    <span className="fb-q-badge omissions">
                                                        Omisiones: {section.questions_stats.omissions}
                                                    </span>
                                                )}
                                                {section.questions_stats.repetitions > 0 && (
                                                    <span className="fb-q-badge repetitions">
                                                        Repeticiones: {section.questions_stats.repetitions}
                                                    </span>
                                                )}
                                                {section.questions_stats.confusing > 0 && (
                                                    <span className="fb-q-badge confusing">
                                                        Confuso: {section.questions_stats.confusing}
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Resumen ejecutivo */}
                                {section.summary && (
                                    <div className="fb-summary-bar">
                                        <span>{section.summary}</span>
                                    </div>
                                )}

                                {/* Problemas categorizados con barras - COLAPSABLE */}
                                {section.problems && section.problems.length > 0 && (
                                    <div className="fb-collapsible-section">
                                        <button
                                            className="fb-collapsible-header"
                                            onClick={() => toggleLearningSection(section.key, "problems")}
                                        >
                                            <span className="fb-collapsible-title">
                                                <FaExclamationTriangle /> Problemas Detectados ({section.problems.length})
                                            </span>
                                            {expandedLearningSections.has(`${section.key}_problems`)
                                                ? <FaChevronDown className="fb-chevron" />
                                                : <FaChevronRight className="fb-chevron" />}
                                        </button>
                                        {expandedLearningSections.has(`${section.key}_problems`) && (
                                            <div className="fb-collapsible-content">
                                                {section.problems.map((problem, i) => (
                                                    <div key={i} className={`fb-problem-item severity-${problem.severity}`}>
                                                        <div className="fb-problem-header">
                                                            <span className="fb-problem-category">{problem.category}</span>
                                                            <span className="fb-problem-count">
                                                                {problem.count} ({problem.percentage}%)
                                                            </span>
                                                        </div>
                                                        <div className="fb-problem-bar">
                                                            <div
                                                                className="fb-problem-bar-fill"
                                                                style={{ width: `${Math.min(problem.percentage, 100)}%` }}
                                                            />
                                                        </div>
                                                        {problem.examples && problem.examples.length > 0 && (
                                                            <div className="fb-problem-examples">
                                                                {problem.examples.slice(0, 2).map((ex, j) => (
                                                                    <span key={j} className="fb-example">"{ex}"</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Reglas para IA - Separadas por estado */}
                                {section.rules && section.rules.length > 0 && (() => {
                                    const pendingRules = section.rules.filter(rule => {
                                        const status = typeof rule === 'string' ? 'pending' : rule.status;
                                        return status === 'detected' || status === 'pending';
                                    });
                                    const processedRules = section.rules.filter(rule => {
                                        const status = typeof rule === 'string' ? 'pending' : rule.status;
                                        return status === 'applied' || status === 'resolved';
                                    });

                                    return (
                                        <>
                                            {/* Reglas Pendientes */}
                                            {pendingRules.length > 0 && (
                                                <div className="fb-collapsible-section">
                                                    <button
                                                        className="fb-collapsible-header rules pending-header"
                                                        onClick={() => toggleLearningSection(section.key, "rules")}
                                                    >
                                                        <span className="fb-collapsible-title pending-title">
                                                            <FaExclamationTriangle /> Reglas Pendientes ({pendingRules.length})
                                                        </span>
                                                        {expandedLearningSections.has(`${section.key}_rules`)
                                                            ? <FaChevronDown className="fb-chevron" />
                                                            : <FaChevronRight className="fb-chevron" />}
                                                    </button>
                                                    {expandedLearningSections.has(`${section.key}_rules`) && (
                                                        <div className="fb-collapsible-content">
                                                            <ul className="fb-rules-list">
                                                                {pendingRules.map((rule, i) => {
                                                                    const ruleText = typeof rule === 'string' ? rule : rule.text;
                                                                    const ruleStatus = typeof rule === 'string' ? 'pending' : rule.status;
                                                                    return (
                                                                        <li key={i} className={`fb-rule-item ${ruleStatus}`}>
                                                                            <span className="fb-rule-icon" title={ruleStatus === 'detected' ? 'Recién detectado' : 'Pendiente de aplicar'}>
                                                                                {ruleStatus === 'detected' && <FaExclamationTriangle />}
                                                                                {ruleStatus === 'pending' && <FaComment />}
                                                                            </span>
                                                                            <span className="fb-rule-text">{ruleText}</span>
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Reglas Procesadas (Histórico) */}
                                            {processedRules.length > 0 && (
                                                <div className="fb-collapsible-section history-section">
                                                    <button
                                                        className="fb-collapsible-header rules history-header"
                                                        onClick={() => toggleLearningSection(`${section.key}_history`, "rules")}
                                                    >
                                                        <span className="fb-collapsible-title history-title">
                                                            <FaCheckCircle /> Reglas Procesadas - Histórico ({processedRules.length})
                                                        </span>
                                                        {expandedLearningSections.has(`${section.key}_history_rules`)
                                                            ? <FaChevronDown className="fb-chevron" />
                                                            : <FaChevronRight className="fb-chevron" />}
                                                    </button>
                                                    {expandedLearningSections.has(`${section.key}_history_rules`) && (
                                                        <div className="fb-collapsible-content history-content">
                                                            <ul className="fb-rules-list">
                                                                {processedRules.map((rule, i) => {
                                                                    const ruleText = typeof rule === 'string' ? rule : rule.text;
                                                                    const ruleStatus = typeof rule === 'string' ? 'applied' : rule.status;
                                                                    return (
                                                                        <li key={i} className={`fb-rule-item ${ruleStatus}`}>
                                                                            <span className="fb-rule-icon" title={ruleStatus === 'applied' ? 'Ya procesada' : 'Problema resuelto'}>
                                                                                {ruleStatus === 'applied' && <FaCheck />}
                                                                                {ruleStatus === 'resolved' && <FaCheckCircle />}
                                                                            </span>
                                                                            <span className="fb-rule-text">{ruleText}</span>
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}

                                {/* Sin problemas */}
                                {(!section.problems || section.problems.length === 0) && section.stats.ok_pct > 70 && (
                                    <div className="fb-no-problems">
                                        <FaCheckCircle /> Sin problemas significativos
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {insightsData.sections.length === 0 && (
                        <div className="fb-empty">
                            No hay suficientes evaluaciones para generar insights.
                            Se necesitan al menos 3 evaluaciones por sección.
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
