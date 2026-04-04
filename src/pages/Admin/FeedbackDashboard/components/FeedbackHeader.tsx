// src/pages/Admin/FeedbackDashboard/components/FeedbackHeader.tsx
import { FaChartBar, FaBrain } from "react-icons/fa";

export type TabKey = "stats" | "grouped" | "learning" | "corrections";

type FeedbackHeaderProps = {
    activeTab: TabKey;
    correctionsCount: number;
    onTabChange: (tab: TabKey) => void;
    onRefresh: () => void;
};

export default function FeedbackHeader({
    activeTab,
    correctionsCount,
    onTabChange,
    onRefresh,
}: FeedbackHeaderProps) {
    return (
        <div className="fb-dash-header">
            <h1><FaChartBar /> Feedback de IA - EPICRISIS</h1>
            <div className="fb-header-actions">
                <div className="fb-tabs">
                    <button
                        className={`fb-tab ${activeTab === "stats" ? "active" : ""}`}
                        onClick={() => onTabChange("stats")}
                    >
                        Estadísticas
                    </button>
                    <button
                        className={`fb-tab ${activeTab === "grouped" ? "active" : ""}`}
                        onClick={() => onTabChange("grouped")}
                    >
                        Por EPC
                    </button>
                    <button
                        className={`fb-tab ${activeTab === "corrections" ? "active" : ""}`}
                        onClick={() => onTabChange("corrections")}
                    >
                        📋 Correcciones {correctionsCount > 0 && <span className="fb-corrections-badge">{correctionsCount}</span>}
                    </button>
                    <button
                        className={`fb-tab ${activeTab === "learning" ? "active" : ""}`}
                        onClick={() => onTabChange("learning")}
                    >
                        <FaBrain /> Aprendizaje
                    </button>
                </div>
                <button className="fb-btn-refresh" onClick={onRefresh}>
                    Actualizar
                </button>
            </div>
        </div>
    );
}
