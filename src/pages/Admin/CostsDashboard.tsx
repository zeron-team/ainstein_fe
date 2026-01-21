// src/pages/Admin/CostsDashboard.tsx
import { useEffect, useState } from "react";
import api from "@/api/axios";
import {
    FaDollarSign,
    FaRobot,
    FaBrain,
    FaChartBar,
    FaCalendarAlt,
    FaSync,
} from "react-icons/fa";

import "./CostsDashboard.css";

interface DailyStats {
    date: string;
    epc_count: number;
    learning_count: number;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
}

interface Summary {
    total_epcs: number;
    total_learning: number;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    total_cost_usd: number;
    llm_cost_usd: number;
    transaction_cost_usd: number;
}

interface ModelBreakdown {
    model: string;
    calls: number;
    tokens: number;
    cost_usd: number;
}

interface CostsData {
    from_date: string;
    to_date: string;
    daily: DailyStats[];
    summary: Summary;
    models: ModelBreakdown[];
}

function formatDate(iso: string): string {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
    });
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toString();
}

export default function CostsDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [data, setData] = useState<CostsData | null>(null);
    const [days, setDays] = useState(30);

    async function loadData() {
        setLoading(true);
        setError("");
        try {
            const toDate = new Date().toISOString().split("T")[0];
            const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0];
            const res = await api.get("/epc/admin/llm-costs", {
                params: { from_date: fromDate, to_date: toDate },
            });
            setData(res.data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Error cargando datos");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [days]);

    if (loading) return <div className="costs-wrap">Cargando costos...</div>;
    if (error) return <div className="costs-wrap"><div className="costs-error">{error}</div></div>;
    if (!data) return <div className="costs-wrap">Sin datos</div>;

    const maxCost = Math.max(...data.daily.map((d) => d.cost_usd), 0.001);

    return (
        <div className="costs-wrap">
            <div className="costs-header">
                <h1><FaDollarSign /> Costos de IA - LLM</h1>
                <div className="costs-actions">
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="costs-select"
                    >
                        <option value={7}>Últimos 7 días</option>
                        <option value={30}>Últimos 30 días</option>
                        <option value={90}>Últimos 90 días</option>
                    </select>
                    <button className="costs-btn-refresh" onClick={loadData}>
                        <FaSync /> Actualizar
                    </button>
                </div>
            </div>

            {/* Resumen Cards */}
            <div className="costs-summary-grid">
                <div className="costs-card">
                    <div className="costs-card-icon epc">
                        <FaRobot />
                    </div>
                    <div className="costs-card-content">
                        <span className="costs-card-value">{data.summary.total_epcs}</span>
                        <span className="costs-card-label">EPCs Generadas</span>
                    </div>
                </div>
                <div className="costs-card">
                    <div className="costs-card-icon learning">
                        <FaBrain />
                    </div>
                    <div className="costs-card-content">
                        <span className="costs-card-value">{data.summary.total_learning}</span>
                        <span className="costs-card-label">Análisis Aprendizaje</span>
                    </div>
                </div>
                <div className="costs-card">
                    <div className="costs-card-icon tokens">
                        <FaChartBar />
                    </div>
                    <div className="costs-card-content">
                        <span className="costs-card-value">{formatNumber(data.summary.total_tokens)}</span>
                        <span className="costs-card-label">Tokens Totales</span>
                    </div>
                </div>
                <div className="costs-card highlight">
                    <div className="costs-card-icon cost">
                        <FaDollarSign />
                    </div>
                    <div className="costs-card-content">
                        <span className="costs-card-value">${data.summary.total_cost_usd.toFixed(2)}</span>
                        <span className="costs-card-label">Costo Total USD</span>
                    </div>
                </div>
            </div>

            {/* Desglose de Costos */}
            <div className="costs-breakdown">
                <div className="costs-breakdown-item">
                    <span className="costs-breakdown-label">💻 Costo LLM (tokens):</span>
                    <span className="costs-breakdown-value">${(data.summary.llm_cost_usd || 0).toFixed(4)}</span>
                </div>
                <div className="costs-breakdown-item">
                    <span className="costs-breakdown-label">🔄 Costo de Transacción:</span>
                    <span className="costs-breakdown-value">${(data.summary.transaction_cost_usd || 0).toFixed(4)}</span>
                </div>
            </div>

            {/* Gráfico de barras por día */}
            <div className="costs-chart-section">
                <h2><FaCalendarAlt /> Costos por Día</h2>
                {data.daily.length === 0 ? (
                    <div className="costs-empty">
                        No hay datos de uso en el período seleccionado.
                        Los costos se registran cuando se generan EPCs o se ejecuta el análisis de aprendizaje.
                    </div>
                ) : (
                    <div className="costs-chart">
                        {data.daily.map((day) => (
                            <div key={day.date} className="costs-bar-wrap">
                                <div className="costs-bar-info">
                                    <span className="costs-bar-date">{formatDate(day.date)}</span>
                                    <span className="costs-bar-value">${day.cost_usd.toFixed(4)}</span>
                                </div>
                                <div className="costs-bar-container">
                                    <div
                                        className="costs-bar"
                                        style={{ width: `${(day.cost_usd / maxCost) * 100}%` }}
                                    />
                                </div>
                                <div className="costs-bar-details">
                                    <span>{day.epc_count} EPC</span>
                                    <span>{day.learning_count} Análisis</span>
                                    <span>{formatNumber(day.total_tokens)} tokens</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabla de modelos */}
            {data.models.length > 0 && (
                <div className="costs-models-section">
                    <h2>Desglose por Modelo</h2>
                    <table className="costs-table">
                        <thead>
                            <tr>
                                <th>Modelo</th>
                                <th>Llamadas</th>
                                <th>Tokens</th>
                                <th>Costo USD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.models.map((m) => (
                                <tr key={m.model}>
                                    <td className="model-name">{m.model.toLowerCase().includes("gemini") ? "Gemini" : m.model}</td>
                                    <td>{m.calls}</td>
                                    <td>{formatNumber(m.tokens)}</td>
                                    <td className="cost">${m.cost_usd.toFixed(4)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
