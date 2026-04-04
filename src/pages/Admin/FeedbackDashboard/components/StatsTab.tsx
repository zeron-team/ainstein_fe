// src/pages/Admin/FeedbackDashboard/components/StatsTab.tsx
import {
    FaThumbsUp,
    FaThumbsDown,
    FaMeh,
    FaChartBar,
    FaChartLine,
    FaLightbulb,
    FaExclamationTriangle,
    FaCheckCircle,
    FaInfoCircle,
} from "react-icons/fa";
import type { FeedbackStats } from "@/types/feedback";
import { SECTION_LABELS, formatDate, timeAgo } from "../constants";

type StatsTabProps = {
    stats: FeedbackStats;
    onOpenInfoModal: (type: "ok" | "partial" | "bad" | "total") => void;
};

export default function StatsTab({ stats, onOpenInfoModal }: StatsTabProps) {
    const { summary, by_section, recent_feedbacks, insights } = stats;

    return (
        <>
            {/* Cards de resumen */}
            <div className="fb-summary-grid">
                <div className="fb-card fb-card-ok">
                    <div className="fb-card-info-icon" onClick={() => onOpenInfoModal("ok")}>
                        <FaInfoCircle />
                    </div>
                    <div className="fb-card-icon"><FaThumbsUp /></div>
                    <div className="fb-card-data">
                        <div className="fb-card-value">{summary.ok}</div>
                        <div className="fb-card-label">OK ({summary.ok_pct}%)</div>
                    </div>
                </div>
                <div className="fb-card fb-card-partial">
                    <div className="fb-card-info-icon" onClick={() => onOpenInfoModal("partial")}>
                        <FaInfoCircle />
                    </div>
                    <div className="fb-card-icon"><FaMeh /></div>
                    <div className="fb-card-data">
                        <div className="fb-card-value">{summary.partial}</div>
                        <div className="fb-card-label">Parcial ({summary.partial_pct}%)</div>
                    </div>
                </div>
                <div className="fb-card fb-card-bad">
                    <div className="fb-card-info-icon" onClick={() => onOpenInfoModal("bad")}>
                        <FaInfoCircle />
                    </div>
                    <div className="fb-card-icon"><FaThumbsDown /></div>
                    <div className="fb-card-data">
                        <div className="fb-card-value">{summary.bad}</div>
                        <div className="fb-card-label">Mal ({summary.bad_pct}%)</div>
                    </div>
                </div>
                <div className="fb-card fb-card-total">
                    <div className="fb-card-info-icon" onClick={() => onOpenInfoModal("total")}>
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

                {/* Ranking de Problemas por Sección */}
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
    );
}
