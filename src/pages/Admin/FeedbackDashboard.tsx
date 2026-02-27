// src/pages/Admin/FeedbackDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import api from "@/api/axios";
import {
    FaThumbsUp,
    FaThumbsDown,
    FaMeh,
    FaChartBar,
    FaChartLine,
    FaLightbulb,
    FaExclamationTriangle,
    FaCheckCircle,
    FaUserMd,
    FaFileMedical,
    FaChevronDown,
    FaChevronRight,
    FaTrash,
    FaBrain,
    FaCheck,
    FaTimes,
    FaComment,
    FaSortAmountDown,
    FaSortAmountUpAlt,
    FaInfoCircle,
    FaSearch,
} from "react-icons/fa";

import "./FeedbackDashboard.css";

type FeedbackStats = {
    summary: {
        total: number;
        ok: number;
        partial: number;
        bad: number;
        ok_pct: number;
        partial_pct: number;
        bad_pct: number;
    };
    by_section: Record<string, { ok: number; partial: number; bad: number; total: number }>;
    questions_summary: {
        omissions: number;
        repetitions: number;
        confusing: number;
    };
    questions_by_section: Record<string, {
        omissions: number;
        repetitions: number;
        confusing: number;
        total_negative: number;
    }>;
    recent_feedbacks: Array<{
        id: string;
        epc_id: string;
        section: string;
        rating: string;
        feedback_text: string;
        created_by_name: string;
        created_at: string;
    }>;
    insights: Array<{
        type: string;
        section: string;
        message: string;
    }>;
    trends?: {
        global_current_pct: number;
        global_previous_pct: number;
        global_change_pct: number;
        global_status: string;
        by_section: Array<{
            section: string;
            current_ok_pct: number;
            previous_ok_pct: number;
            change_pct: number;
            status: string;
            current_total: number;
            previous_total: number;
        }>;
        current_week_total: number;
        previous_week_total: number;
    };
};

// Tipos para vista agrupada
type GroupedSection = {
    section: string;
    rating: string;
    feedback_text: string | null;
    created_at: string | null;
    // Campos de preguntas obligatorias (para ratings negativos)
    has_omissions?: boolean | null;
    has_repetitions?: boolean | null;
    is_confusing?: boolean | null;
};

type GroupedEvaluator = {
    evaluator_id: string;
    evaluator_name: string;
    evaluated_at: string | null;
    sections: GroupedSection[];
};

type GroupedEPC = {
    epc_id: string;
    patient_id: string | null;
    patient_name: string | null;
    hce_origin_id: string | null;
    epc_created_at: string | null;
    evaluators: GroupedEvaluator[];
    total_sections_evaluated: number;
};

type GroupedFeedbackResponse = {
    grouped_epc: GroupedEPC[];
};

// Tipos para vista de Aprendizaje (con análisis LLM)
interface Problem {
    category: string;
    count: number;
    severity: "alta" | "media" | "baja";
    percentage: number;
    examples: string[];
}

// Tipo para reglas con estado
interface RuleWithStatus {
    text: string;
    status: "detected" | "pending" | "applied" | "resolved";
    section?: string;
    detected_at?: string;
}

interface SectionLearning {
    key: string;
    name: string;
    stats: {
        total: number;
        ok: number;
        partial: number;
        bad: number;
        ok_pct: number;
        negative_pct: number;
    };
    problems: Problem[];
    rules: RuleWithStatus[] | string[];  // Soporta ambos formatos para compatibilidad
    summary: string;
    questions_stats?: {
        omissions: number;
        repetitions: number;
        confusing: number;
    };
}

interface InsightsData {
    sections: SectionLearning[];
    total_feedbacks_analyzed: number;
    computed_at: string | null;
};

const SECTION_LABELS: Record<string, string> = {
    motivo_internacion: "Motivo internación",
    evolucion: "Evolución",
    procedimientos: "Procedimientos",
    interconsultas: "Interconsultas",
    medicacion: "Tratamiento",
    indicaciones_alta: "Indicaciones alta",
    recomendaciones: "Recomendaciones",
};

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function timeAgo(iso: string | null): string {
    if (!iso) return "";
    const now = new Date();
    const then = new Date(iso);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return "hace segundos";
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
}

export default function FeedbackDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [stats, setStats] = useState<FeedbackStats | null>(null);

    // Estado para tabs y vista agrupada
    const [activeTab, setActiveTab] = useState<"stats" | "grouped" | "learning" | "corrections">("stats");
    const [groupedData, setGroupedData] = useState<GroupedEPC[]>([]);
    const [loadingGrouped, setLoadingGrouped] = useState(false);
    const [searchGrouped, setSearchGrouped] = useState("");
    const [expandedEpcs, setExpandedEpcs] = useState<Set<string>>(new Set());
    const [expandedTexts, setExpandedTexts] = useState<Set<string>>(new Set());

    // Estado para vista de Aprendizaje
    const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);

    // Estado para estadísticas de aprendizaje
    const [learningStats, setLearningStats] = useState<{
        summary: {
            total_analyses: number;
            analyses_this_week: number;
            analyses_this_month: number;
            total_feedbacks_processed: number;
            total_problems_detected: number;
            total_rules_generated: number;
        };
        last_analysis: {
            timestamp: string | null;
            feedbacks_analyzed: number;
            problems_found: number;
            rules_generated: number;
        } | null;
        weekly_history: Array<{
            week: string;
            events: number;
            problems: number;
            rules: number;
        }>;
    } | null>(null);

    // Estado para secciones colapsables en cada card de aprendizaje
    // Formato: "sectionKey_problems" o "sectionKey_rules"
    const [expandedLearningSections, setExpandedLearningSections] = useState<Set<string>>(new Set());

    // Estado para correcciones de items entre secciones
    type CorrectionEntry = { _id: string; epc_id: string; item: string; from_section: string; to_section: string | null; action: string; user_id: string | null; created_at: string | null; patient_id: string | null; patient_name: string | null; approval_status: string; approved_by: string | null; approved_at: string | null };
    type DictionaryRule = { id: string; item_pattern: string; target_section: string; frequency: number; created_at: string | null; updated_at: string | null };
    const [correctionsData, setCorrectionsData] = useState<CorrectionEntry[]>([]);
    const [loadingCorrections, setLoadingCorrections] = useState(false);
    const [dictionaryRules, setDictionaryRules] = useState<DictionaryRule[]>([]);
    const [approvingId, setApprovingId] = useState<string | null>(null);

    // Modal de confirmación para aprobar/rechazar
    type PendingAction = { correctionId: string; status: "approved" | "rejected"; itemText: string } | null;
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);

    function toggleLearningSection(sectionKey: string, type: "problems" | "rules") {
        const key = `${sectionKey}_${type}`;
        setExpandedLearningSections(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }

    // Estado para ordenamiento en tab "Por EPC"
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    // Estado para modal de información de métricas
    const [infoModal, setInfoModal] = useState<{ open: boolean; title: string; content: string }>({
        open: false,
        title: "",
        content: ""
    });

    const openInfoModal = (type: "ok" | "partial" | "bad" | "total") => {
        const infos = {
            ok: {
                title: "✅ OK - Feedback Positivo",
                content: "Indica que el usuario aceptó la sección generada por la IA sin necesidad de modificaciones significativas.\n\n• La IA generó contenido correcto\n• El usuario validó que está bien\n• No requirió edición"
            },
            partial: {
                title: "🟡 Parcial - Con Modificaciones",
                content: "Indica que el usuario hizo modificaciones menores a la sección generada.\n\n• La IA generó contenido aceptable\n• El usuario ajustó algunos detalles\n• La base estaba correcta pero necesitó refinamiento"
            },
            bad: {
                title: "❌ Mal - Feedback Negativo",
                content: "Indica que el usuario considera que la sección generada fue incorrecta o insatisfactoria.\n\n• La IA generó contenido inadecuado\n• El usuario tuvo que reescribir significativamente\n• Identifica áreas de mejora del modelo"
            },
            total: {
                title: "📊 Total de Feedbacks",
                content: "Suma de todos los feedbacks registrados (OK + Parcial + Mal).\n\n• Cada evaluación de sección cuenta como 1 feedback\n• Un EPC puede tener múltiples feedbacks (uno por sección)\n• Representa el volumen total de datos de entrenamiento"
            }
        };
        setInfoModal({ open: true, ...infos[type] });
    };

    function toggleTextExpand(key: string) {
        setExpandedTexts(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        setLoading(true);
        setError("");
        try {
            const { data } = await api.get("/epc/feedback/stats");
            setStats(data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Error cargando estadísticas");
        } finally {
            setLoading(false);
        }
    }

    async function loadGrouped() {
        setLoadingGrouped(true);
        try {
            const { data } = await api.get<GroupedFeedbackResponse>("/epc/feedback/grouped");
            setGroupedData(data.grouped_epc || []);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Error cargando feedbacks agrupados");
        } finally {
            setLoadingGrouped(false);
        }
    }

    function toggleEpcExpand(epcId: string) {
        setExpandedEpcs(prev => {
            const next = new Set(prev);
            if (next.has(epcId)) {
                next.delete(epcId);
            } else {
                next.add(epcId);
            }
            return next;
        });
    }

    function handleTabChange(tab: "stats" | "grouped" | "learning" | "corrections") {
        setActiveTab(tab);
        if (tab === "grouped" && groupedData.length === 0) {
            loadGrouped();
        }
        if (tab === "learning" && !insightsData) {
            loadInsights();
        }
        if (tab === "corrections" && correctionsData.length === 0) {
            loadCorrections();
        }
    }

    async function loadCorrections() {
        setLoadingCorrections(true);
        try {
            const [corrRes, dictRes] = await Promise.all([
                api.get("/epc/feedback/corrections"),
                api.get("/epc/feedback/section-dictionary"),
            ]);
            setCorrectionsData(corrRes.data.corrections || []);

            setDictionaryRules(dictRes.data.rules || []);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Error cargando correcciones");
        } finally {
            setLoadingCorrections(false);
        }
    }

    async function approveCorrection(correctionId: string, status: "approved" | "rejected") {
        setApprovingId(correctionId);
        setPendingAction(null);
        try {
            await api.patch(`/epc/section-corrections/${correctionId}/approve`, { status });
            await loadCorrections();
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Error al procesar aprobación");
        } finally {
            setApprovingId(null);
        }
    }

    function requestApproval(correctionId: string, status: "approved" | "rejected", itemText: string) {
        setPendingAction({ correctionId, status, itemText });
    }

    async function markAsConsultar(correctionId: string) {
        setApprovingId(correctionId);
        try {
            await api.patch(`/epc/section-corrections/${correctionId}/approve`, { status: "consultar" });
            await loadCorrections();
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Error al marcar como consultar");
        } finally {
            setApprovingId(null);
        }
    }

    async function revokeApproval(correctionId: string) {
        setApprovingId(correctionId);
        try {
            await api.patch(`/epc/section-corrections/${correctionId}/approve`, { status: "pending" });
            await loadCorrections();
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Error al revocar");
        } finally {
            setApprovingId(null);
        }
    }

    async function loadInsights() {
        setLoadingInsights(true);
        try {
            // Cargar insights y learning stats en paralelo
            const [insightsRes, learningRes] = await Promise.all([
                api.get("/epc/feedback/insights"),
                api.get("/epc/feedback/learning-stats"),
            ]);
            setInsightsData(insightsRes.data);
            setLearningStats(learningRes.data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Error cargando insights");
        } finally {
            setLoadingInsights(false);
        }
    }

    // Ordenar datos agrupados por fecha de creación
    const sortedGroupedData = useMemo(() => {
        let sorted = [...groupedData];
        // Filtro de búsqueda por paciente
        if (searchGrouped.trim()) {
            const q = searchGrouped.toLowerCase();
            sorted = sorted.filter(epc =>
                (epc.patient_name || "").toLowerCase().includes(q) ||
                (epc.patient_id || "").toLowerCase().includes(q) ||
                (epc.epc_id || "").toLowerCase().includes(q)
            );
        }
        sorted.sort((a, b) => {
            const dateA = a.epc_created_at ? new Date(a.epc_created_at).getTime() : (sortDirection === "asc" ? Infinity : -Infinity);
            const dateB = b.epc_created_at ? new Date(b.epc_created_at).getTime() : (sortDirection === "asc" ? Infinity : -Infinity);
            return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
        });
        return sorted;
    }, [groupedData, sortDirection, searchGrouped]);

    // Eliminar feedbacks de un evaluador
    const [deletingEvaluator, setDeletingEvaluator] = useState<string | null>(null);

    async function deleteEvaluatorFeedback(epcId: string, evaluatorId: string, evaluatorName: string) {
        const confirmed = window.confirm(
            `¿Eliminar todas las evaluaciones de "${evaluatorName}" para esta EPC?\n\nEsta acción no se puede deshacer.`
        );
        if (!confirmed) return;

        setDeletingEvaluator(`${epcId}_${evaluatorId}`);
        try {
            await api.delete(`/epc/feedback/${epcId}/evaluator/${evaluatorId}`);
            // Recargar datos agrupados
            await loadGrouped();
            // También recargar stats para actualizar las estadísticas
            await loadStats();
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Error al eliminar evaluaciones");
        } finally {
            setDeletingEvaluator(null);
        }
    }

    if (loading) return <div className="fb-dash-wrap">Cargando estadísticas...</div>;
    if (error && !stats) return <div className="fb-dash-wrap"><div className="fb-error">{error}</div></div>;
    if (!stats) return <div className="fb-dash-wrap">Sin datos</div>;

    const { summary, by_section, recent_feedbacks, insights } = stats;

    return (
        <div className="fb-dash-wrap">
            <div className="fb-dash-header">
                <h1><FaChartBar /> Feedback de IA - EPICRISIS</h1>
                <div className="fb-header-actions">
                    <div className="fb-tabs">
                        <button
                            className={`fb-tab ${activeTab === "stats" ? "active" : ""}`}
                            onClick={() => handleTabChange("stats")}
                        >
                            Estadísticas
                        </button>
                        <button
                            className={`fb-tab ${activeTab === "grouped" ? "active" : ""}`}
                            onClick={() => handleTabChange("grouped")}
                        >
                            Por EPC
                        </button>
                        <button
                            className={`fb-tab ${activeTab === "corrections" ? "active" : ""}`}
                            onClick={() => handleTabChange("corrections")}
                        >
                            📋 Correcciones {correctionsData.length > 0 && <span className="fb-corrections-badge">{correctionsData.length}</span>}
                        </button>
                        <button
                            className={`fb-tab ${activeTab === "learning" ? "active" : ""}`}
                            onClick={() => handleTabChange("learning")}
                        >
                            <FaBrain /> Aprendizaje
                        </button>
                    </div>
                    <button className="fb-btn-refresh" onClick={activeTab === "stats" ? loadStats : loadGrouped}>
                        Actualizar
                    </button>
                </div>
            </div>

            {/* ===================== TAB: ESTADÍSTICAS ===================== */}
            {activeTab === "stats" && (
                <>
                    {/* Cards de resumen */}
                    <div className="fb-summary-grid">
                        <div className="fb-card fb-card-ok">
                            <div className="fb-card-info-icon" onClick={() => openInfoModal("ok")}>
                                <FaInfoCircle />
                            </div>
                            <div className="fb-card-icon"><FaThumbsUp /></div>
                            <div className="fb-card-data">
                                <div className="fb-card-value">{summary.ok}</div>
                                <div className="fb-card-label">OK ({summary.ok_pct}%)</div>
                            </div>
                        </div>
                        <div className="fb-card fb-card-partial">
                            <div className="fb-card-info-icon" onClick={() => openInfoModal("partial")}>
                                <FaInfoCircle />
                            </div>
                            <div className="fb-card-icon"><FaMeh /></div>
                            <div className="fb-card-data">
                                <div className="fb-card-value">{summary.partial}</div>
                                <div className="fb-card-label">Parcial ({summary.partial_pct}%)</div>
                            </div>
                        </div>
                        <div className="fb-card fb-card-bad">
                            <div className="fb-card-info-icon" onClick={() => openInfoModal("bad")}>
                                <FaInfoCircle />
                            </div>
                            <div className="fb-card-icon"><FaThumbsDown /></div>
                            <div className="fb-card-data">
                                <div className="fb-card-value">{summary.bad}</div>
                                <div className="fb-card-label">Mal ({summary.bad_pct}%)</div>
                            </div>
                        </div>
                        <div className="fb-card fb-card-total">
                            <div className="fb-card-info-icon" onClick={() => openInfoModal("total")}>
                                <FaInfoCircle />
                            </div>
                            <div className="fb-card-icon"><FaChartBar /></div>
                            <div className="fb-card-data">
                                <div className="fb-card-value">{summary.total}</div>
                                <div className="fb-card-label">Total feedbacks</div>
                            </div>
                        </div>
                    </div>

                    <div className="fb-main-grid">
                        {/* Distribución por sección */}
                        <div className="fb-panel">
                            <h2>Distribución por Sección</h2>
                            <div className="fb-sections">
                                {Object.entries(by_section).map(([section, data]) => {
                                    const okPct = data.total > 0 ? (data.ok / data.total) * 100 : 0;
                                    const partialPct = data.total > 0 ? (data.partial / data.total) * 100 : 0;
                                    const badPct = data.total > 0 ? (data.bad / data.total) * 100 : 0;
                                    const isWarning = badPct >= 20;

                                    return (
                                        <div key={section} className={`fb-section-row ${isWarning ? "warning" : ""}`}>
                                            <div className="fb-section-label">
                                                {SECTION_LABELS[section] || section}
                                                {isWarning && <FaExclamationTriangle className="warning-icon" />}
                                            </div>
                                            <div className="fb-section-bar">
                                                <div className="fb-bar-ok" style={{ width: `${okPct}%` }} title={`OK: ${data.ok}`} />
                                                <div className="fb-bar-partial" style={{ width: `${partialPct}%` }} title={`Parcial: ${data.partial}`} />
                                                <div className="fb-bar-bad" style={{ width: `${badPct}%` }} title={`Mal: ${data.bad}`} />
                                            </div>
                                            <div className="fb-section-stats">
                                                <span className="stat-ok">{okPct.toFixed(0)}%</span>
                                                <span className="stat-total">({data.total})</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {Object.keys(by_section).length === 0 && (
                                    <div className="fb-empty">Sin datos de secciones aún</div>
                                )}
                            </div>
                        </div>

                        {/* Ranking de Problemas por Sección - Barras horizontales */}
                        {stats.questions_by_section && Object.keys(stats.questions_by_section).length > 0 && (
                            <div className="fb-panel fb-panel-questions">
                                <h2><FaExclamationTriangle /> Problemas por Sección</h2>
                                <div className="fb-problems-sections">
                                    {Object.entries(stats.questions_by_section).map(([section, data]) => {
                                        const total = data.omissions + data.repetitions + data.confusing;
                                        if (total === 0) return null;
                                        const omPct = (data.omissions / total) * 100;
                                        const repPct = (data.repetitions / total) * 100;
                                        const confPct = (data.confusing / total) * 100;
                                        return (
                                            <div key={section} className="fb-prob-row">
                                                <span className="fb-prob-section-name">
                                                    {SECTION_LABELS[section] || section}
                                                </span>
                                                <div className="fb-prob-bar-container">
                                                    {data.omissions > 0 && (
                                                        <div
                                                            className="fb-prob-bar omissions"
                                                            style={{ width: `${omPct}%` }}
                                                            title={`Omisiones: ${data.omissions}`}
                                                        />
                                                    )}
                                                    {data.repetitions > 0 && (
                                                        <div
                                                            className="fb-prob-bar repetitions"
                                                            style={{ width: `${repPct}%` }}
                                                            title={`Repeticiones: ${data.repetitions}`}
                                                        />
                                                    )}
                                                    {data.confusing > 0 && (
                                                        <div
                                                            className="fb-prob-bar confusing"
                                                            style={{ width: `${confPct}%` }}
                                                            title={`Confuso: ${data.confusing}`}
                                                        />
                                                    )}
                                                </div>
                                                <span className="fb-prob-total">({total})</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="fb-qs-legend">
                                    <span className="fb-qs-legend-item"><span className="dot omissions"></span> Omisiones</span>
                                    <span className="fb-qs-legend-item"><span className="dot repetitions"></span> Repeticiones</span>
                                    <span className="fb-qs-legend-item"><span className="dot confusing"></span> Confuso</span>
                                </div>
                            </div>
                        )}

                        {/* Panel de Evolución del Generador */}
                        {stats.trends && (
                            <div className="fb-panel fb-panel-trends">
                                <h2><FaChartLine /> Evolución del Generador</h2>

                                {/* Indicador global */}
                                <div className="fb-trends-global">
                                    <div className={`fb-trend-indicator ${stats.trends.global_status}`}>
                                        {stats.trends.global_status === "improving" && "📈"}
                                        {stats.trends.global_status === "declining" && "📉"}
                                        {stats.trends.global_status === "stable" && "➡️"}
                                        <span className="trend-value">
                                            {stats.trends.global_change_pct > 0 ? "+" : ""}
                                            {stats.trends.global_change_pct}%
                                        </span>
                                    </div>
                                    <div className="fb-trend-labels">
                                        <span>Semana actual: <strong>{stats.trends.global_current_pct}% OK</strong></span>
                                        <span>Semana anterior: {stats.trends.global_previous_pct}% OK</span>
                                    </div>
                                </div>

                                {/* Tendencias por sección */}
                                {stats.trends.by_section.length > 0 && (
                                    <div className="fb-trends-sections">
                                        <h3>Por Sección (vs semana anterior)</h3>
                                        {stats.trends.by_section.map((t, idx) => (
                                            <div key={idx} className={`fb-trend-row ${t.status}`}>
                                                <span className="fb-trend-section">{SECTION_LABELS[t.section] || t.section}</span>
                                                <span className={`fb-trend-change ${t.status}`}>
                                                    {t.status === "improving" && "↑"}
                                                    {t.status === "declining" && "↓"}
                                                    {t.status === "stable" && "→"}
                                                    {t.change_pct > 0 ? "+" : ""}{t.change_pct}%
                                                </span>
                                                <span className="fb-trend-pct">{t.current_ok_pct}% OK</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {stats.trends.by_section.length === 0 && (
                                    <div className="fb-empty">No hay suficientes datos para calcular tendencias (mínimo 2 semanas)</div>
                                )}
                            </div>
                        )}
                        {/* Insights */}
                        <div className="fb-panel fb-panel-insights">
                            <h2><FaLightbulb /> Insights</h2>
                            <div className="fb-insights">
                                {insights.map((insight, idx) => (
                                    <div key={idx} className={`fb-insight fb-insight-${insight.type}`}>
                                        {insight.type === "warning" && <FaExclamationTriangle />}
                                        {insight.type === "success" && <FaCheckCircle />}
                                        <span>{insight.message}</span>
                                    </div>
                                ))}
                                {insights.length === 0 && (
                                    <div className="fb-empty">No hay insights aún. Necesitas más feedback para generar recomendaciones.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Feedbacks recientes */}
                    <div className="fb-panel fb-panel-recent">
                        <h2>Feedbacks Recientes</h2>
                        <div className="fb-table-wrap">
                            <table className="fb-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Sección</th>
                                        <th>Rating</th>
                                        <th>Feedback</th>
                                        <th>Usuario</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent_feedbacks.map((fb) => (
                                        <tr key={fb.id}>
                                            <td className="fb-td-date" title={formatDate(fb.created_at)}>
                                                {timeAgo(fb.created_at)}
                                            </td>
                                            <td>{SECTION_LABELS[fb.section] || fb.section}</td>
                                            <td>
                                                <span className={`fb-rating-badge ${fb.rating}`}>
                                                    {fb.rating === "ok" && <FaThumbsUp />}
                                                    {fb.rating === "partial" && <FaMeh />}
                                                    {fb.rating === "bad" && <FaThumbsDown />}
                                                </span>
                                            </td>
                                            <td className="fb-td-text">{fb.feedback_text}</td>
                                            <td>{fb.created_by_name || "—"}</td>
                                        </tr>
                                    ))}
                                    {recent_feedbacks.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="fb-empty">Sin feedbacks con texto aún</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ===================== TAB: POR EPC ===================== */}
            {activeTab === "grouped" && (
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
            )}

            {/* ===================== TAB: APRENDIZAJE ===================== */}
            {activeTab === "learning" && (
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
                                            Basado en <b>{insightsData.total_feedbacks_analyzed}</b> evaluaciones analizadas.
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
                                <button
                                    className="fb-btn-refresh"
                                    onClick={async () => {
                                        setLoadingInsights(true);
                                        try {
                                            const res = await api.get("/epc/feedback/insights?force_refresh=true");
                                            setInsightsData(res.data);
                                        } catch (e) {
                                            console.error(e);
                                        } finally {
                                            setLoadingInsights(false);
                                        }
                                    }}
                                >
                                    Recalcular
                                </button>
                            </div>

                            {/* Cards por sección */}
                            <div className="fb-learning-grid">
                                {insightsData.sections.map((section) => (
                                    <div
                                        key={section.key}
                                        className={`fb-learning-card ${section.stats.negative_pct > 50 ? "problematic" : section.stats.ok_pct > 70 ? "good" : ""}`}
                                    >
                                        {/* Header con stats */}
                                        <div className="fb-learning-card-header">
                                            <h3>{section.name}</h3>
                                            {/* Stats con íconos de rating */}
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
                                            // Agrupar reglas por estado
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
            )}



{/* ===================== TAB: CORRECCIONES ===================== */ }
{
    activeTab === "corrections" && (
        <div className="fb-corrections-view">
            {loadingCorrections && <div className="fb-loading">Cargando correcciones...</div>}

            {!loadingCorrections && (
                <>
                    {/* Cards de resumen por estado de aprobación */}
                    {(() => {
                        const counts = { pending: 0, approved: 0, rejected: 0, consultar: 0 };
                        correctionsData.forEach(c => {
                            const s = c.approval_status || "pending";
                            if (s in counts) counts[s as keyof typeof counts]++;
                        });
                        return (
                            <div className="fb-summary-grid">
                                <div className="fb-card fb-card-partial">
                                    <div className="fb-card-icon">⏳</div>
                                    <div className="fb-card-data">
                                        <div className="fb-card-value">{counts.pending}</div>
                                        <div className="fb-card-label">Pendientes</div>
                                    </div>
                                </div>
                                <div className="fb-card fb-card-ok">
                                    <div className="fb-card-icon"><FaCheck /></div>
                                    <div className="fb-card-data">
                                        <div className="fb-card-value">{counts.approved}</div>
                                        <div className="fb-card-label">Aprobadas</div>
                                    </div>
                                </div>
                                <div className="fb-card fb-card-bad">
                                    <div className="fb-card-icon"><FaTimes /></div>
                                    <div className="fb-card-data">
                                        <div className="fb-card-value">{counts.rejected}</div>
                                        <div className="fb-card-label">Rechazadas</div>
                                    </div>
                                </div>
                                <div className="fb-card fb-card-total">
                                    <div className="fb-card-icon"><FaSearch /></div>
                                    <div className="fb-card-data">
                                        <div className="fb-card-value">{counts.consultar}</div>
                                        <div className="fb-card-label">A consultar</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Lista de correcciones */}
                    <div className="fb-panel">
                        <h2>📋 Detalle de correcciones</h2>
                        {correctionsData.length === 0 ? (
                            <div className="fb-empty">No hay correcciones registradas aún.</div>
                        ) : (
                            <div className="fb-table-wrap">
                                <table className="fb-table">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Paciente</th>
                                            <th>Acción</th>
                                            <th>Item</th>
                                            <th>Origen</th>
                                            <th>Destino</th>
                                            <th>Estado</th>
                                            <th>EPC</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {correctionsData.map((c, i) => (
                                            <tr key={c._id || i}>
                                                <td className="fb-td-date" title={c.created_at || ""}>
                                                    {c.created_at ? timeAgo(c.created_at) : "—"}
                                                </td>
                                                <td className="fb-td-patient">
                                                    {c.patient_name ? (
                                                        <span className="fb-corr-patient" title={c.patient_id || ""}>
                                                            <FaUserMd style={{ marginRight: 4, opacity: 0.6 }} />
                                                            {c.patient_name}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`fb-corr-action-badge fb-corr-${c.action}`}>
                                                        {c.action === "move" ? "↔ Traslado" : c.action === "remove" ? "✗ Eliminado" : "✓ Confirmado"}
                                                    </span>
                                                </td>
                                                <td className="fb-td-text">{c.item}</td>
                                                <td>
                                                    <span className="fb-corr-section">{SECTION_LABELS[c.from_section] || c.from_section}</span>
                                                </td>
                                                <td>
                                                    {c.action === "move" && c.to_section ? (
                                                        <span className="fb-corr-section">{SECTION_LABELS[c.to_section] || c.to_section}</span>
                                                    ) : (
                                                        <span style={{ color: "#94a3b8" }}>—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {c.approval_status === "approved" ? (
                                                        <div className="fb-corr-status-resolved">
                                                            <span className="fb-corr-status-badge fb-corr-approved" title={`Aprobada por ${c.approved_by || "—"}`}>
                                                                <FaCheck /> Aprobada
                                                            </span>
                                                            <button
                                                                className="fb-corr-revoke-btn"
                                                                title="Revocar aprobación"
                                                                disabled={approvingId === c._id}
                                                                onClick={() => revokeApproval(c._id)}
                                                            >
                                                                Revocar
                                                            </button>
                                                        </div>
                                                    ) : c.approval_status === "rejected" ? (
                                                        <div className="fb-corr-status-resolved">
                                                            <span className="fb-corr-status-badge fb-corr-rejected" title={`Rechazada por ${c.approved_by || "—"}`}>
                                                                <FaTimes /> Rechazada
                                                            </span>
                                                            <button
                                                                className="fb-corr-revoke-btn"
                                                                title="Revocar rechazo"
                                                                disabled={approvingId === c._id}
                                                                onClick={() => revokeApproval(c._id)}
                                                            >
                                                                Revocar
                                                            </button>
                                                        </div>
                                                    ) : c.approval_status === "consultar" ? (
                                                        <div className="fb-corr-status-resolved">
                                                            <span className="fb-corr-status-badge fb-corr-consultar" title="Pendiente de consulta">
                                                                <FaSearch /> A consultar
                                                            </span>
                                                            <button
                                                                className="fb-corr-revoke-btn"
                                                                title="Volver a pendiente"
                                                                disabled={approvingId === c._id}
                                                                onClick={() => revokeApproval(c._id)}
                                                            >
                                                                Revocar
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="fb-corr-approval-actions">
                                                            <button
                                                                className="fb-corr-approve-btn"
                                                                title="Aprobar corrección"
                                                                disabled={approvingId === c._id}
                                                                onClick={() => requestApproval(c._id, "approved", c.item)}
                                                            >
                                                                <FaCheck />
                                                            </button>
                                                            <button
                                                                className="fb-corr-reject-btn"
                                                                title="Rechazar corrección"
                                                                disabled={approvingId === c._id}
                                                                onClick={() => requestApproval(c._id, "rejected", c.item)}
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                            <button
                                                                className="fb-corr-consultar-btn"
                                                                title="A consultar más tarde"
                                                                disabled={approvingId === c._id}
                                                                onClick={() => markAsConsultar(c._id)}
                                                            >
                                                                <FaSearch />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ fontSize: 11, color: "#64748b" }}>{c.epc_id?.slice(0, 8)}...</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Diccionario de mapeo aprendido */}
                    <div className="fb-panel fb-panel-dictionary">
                        <h2>📖 Diccionario de Mapeo Aprendido</h2>
                        <p className="fb-dictionary-desc">
                            Reglas aprendidas a partir de correcciones aprobadas. El sistema usará estas reglas para clasificar items similares automáticamente.
                        </p>
                        {dictionaryRules.length === 0 ? (
                            <div className="fb-empty">No hay reglas aprendidas aún. Apruebe correcciones para generar reglas.</div>
                        ) : (
                            <div className="fb-table-wrap">
                                <table className="fb-table">
                                    <thead>
                                        <tr>
                                            <th>Item (patrón)</th>
                                            <th>Sección destino</th>
                                            <th>Frecuencia</th>
                                            <th>Última actualización</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dictionaryRules.map((rule) => (
                                            <tr key={rule.id}>
                                                <td className="fb-td-text"><strong>{rule.item_pattern}</strong></td>
                                                <td>
                                                    <span className="fb-corr-section">{SECTION_LABELS[rule.target_section] || rule.target_section}</span>
                                                </td>
                                                <td>
                                                    <span className="fb-dict-freq">{rule.frequency}×</span>
                                                </td>
                                                <td className="fb-td-date">{rule.updated_at ? timeAgo(rule.updated_at) : "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

{/* Modal de confirmación de aprobación/rechazo */ }
{
    pendingAction && (
        <div className="fb-confirm-overlay" onClick={() => setPendingAction(null)}>
            <div className="fb-confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="fb-confirm-header">
                    <FaExclamationTriangle style={{ color: pendingAction.status === "approved" ? "#16a34a" : "#dc2626", fontSize: 20 }} />
                    <h3>{pendingAction.status === "approved" ? "Confirmar aprobación" : "Confirmar rechazo"}</h3>
                </div>
                <div className="fb-confirm-body">
                    <p className="fb-confirm-item-preview">
                        <strong>Item:</strong> {pendingAction.itemText?.slice(0, 80)}{(pendingAction.itemText?.length || 0) > 80 ? "..." : ""}
                    </p>
                    {pendingAction.status === "approved" ? (
                        <div className="fb-confirm-warning">
                            <FaExclamationTriangle style={{ color: "#d97706", flexShrink: 0 }} />
                            <p>Al <strong>aprobar</strong> esta corrección, se creará una <strong>regla de aprendizaje</strong> en el diccionario de mapeo. Esta acción influirá en futuras clasificaciones del sistema.</p>
                        </div>
                    ) : (
                        <div className="fb-confirm-warning fb-confirm-warning-red">
                            <FaExclamationTriangle style={{ color: "#dc2626", flexShrink: 0 }} />
                            <p>Al <strong>rechazar</strong> esta corrección, se descartará y no se creará ninguna regla de aprendizaje.</p>
                        </div>
                    )}
                    <p className="fb-confirm-hint">
                        Si no está seguro, puede usar la opción <strong>"A consultar"</strong> para revisarla más tarde.
                    </p>
                </div>
                <div className="fb-confirm-actions">
                    <button
                        className="fb-confirm-cancel-btn"
                        onClick={() => setPendingAction(null)}
                    >
                        Cancelar
                    </button>
                    <button
                        className="fb-confirm-consultar-btn"
                        onClick={() => { markAsConsultar(pendingAction.correctionId); setPendingAction(null); }}
                    >
                        <FaSearch /> A consultar
                    </button>
                    <button
                        className={`fb-confirm-ok-btn ${pendingAction.status === "approved" ? "fb-confirm-ok-approve" : "fb-confirm-ok-reject"}`}
                        onClick={() => approveCorrection(pendingAction.correctionId, pendingAction.status)}
                    >
                        {pendingAction.status === "approved" ? <><FaCheck /> Sí, aprobar</> : <><FaTimes /> Sí, rechazar</>}
                    </button>
                </div>
            </div>
        </div>
    )
}

{/* Modal de información de métricas */ }
{
    infoModal.open && (
        <div className="fb-info-modal-overlay" onClick={() => setInfoModal({ ...infoModal, open: false })}>
            <div className="fb-info-modal" onClick={(e) => e.stopPropagation()}>
                <div className="fb-info-modal-header">
                    <h3>{infoModal.title}</h3>
                    <button className="fb-info-modal-close" onClick={() => setInfoModal({ ...infoModal, open: false })}>
                        <FaTimes />
                    </button>
                </div>
                <div className="fb-info-modal-content">
                    {infoModal.content.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                    ))}
                </div>
            </div>
        </div>
    )
}
        </div >
    );
}
