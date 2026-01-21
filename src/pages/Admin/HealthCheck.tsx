// src/pages/Admin/HealthCheck.tsx - REDISEÑO PROFESIONAL
import { useEffect, useState } from "react";
import api from "@/api/axios";
import {
    FaCheckCircle,
    FaExclamationTriangle,
    FaTimesCircle,
    FaDatabase,
    FaCloud,
    FaBrain,
    FaServer,
    FaSync,
    FaMinusCircle,
    FaNetworkWired,
} from "react-icons/fa";

import "./HealthCheck.css";

type ServiceStatus = {
    status: "ok" | "error" | "warning" | "disabled";
    message: string;
    [key: string]: any;
};

type HealthResponse = {
    status: "healthy" | "unhealthy" | "degraded";
    timestamp: string;
    services: Record<string, ServiceStatus>;
    environment: string;
};

const SERVICE_CONFIG: Record<string, { label: string; icon: JSX.Element; description: string; category: string }> = {
    mysql: {
        label: "MySQL",
        icon: <FaDatabase />,
        description: "Base de datos relacional principal",
        category: "Bases de Datos",
    },
    mongodb: {
        label: "MongoDB",
        icon: <FaDatabase />,
        description: "Almacenamiento de HCEs y EPCs",
        category: "Bases de Datos",
    },
    qdrant: {
        label: "Qdrant",
        icon: <FaServer />,
        description: "Base vectorial para RAG",
        category: "Bases de Datos",
    },
    gemini_api: {
        label: "Gemini API",
        icon: <FaBrain />,
        description: "IA generativa de Google",
        category: "Servicios IA",
    },
    langchain: {
        label: "LangChain",
        icon: <FaBrain />,
        description: "Orquestación de IA",
        category: "Servicios IA",
    },
    ainstein_ws: {
        label: "WebService Markey",
        icon: <FaCloud />,
        description: "Episodios clínicos externos",
        category: "Integraciones",
    },
};

function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case "ok":
            return <FaCheckCircle className="hc-status-icon hc-status-ok" />;
        case "error":
            return <FaTimesCircle className="hc-status-icon hc-status-error" />;
        case "warning":
            return <FaExclamationTriangle className="hc-status-icon hc-status-warning" />;
        case "disabled":
            return <FaMinusCircle className="hc-status-icon hc-status-disabled" />;
        default:
            return <FaExclamationTriangle className="hc-status-icon hc-status-warning" />;
    }
}

function formatTimestamp(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function getStatusLabel(status: string): string {
    switch (status) {
        case "ok": return "Operativo";
        case "error": return "Error";
        case "warning": return "Advertencia";
        case "disabled": return "Deshabilitado";
        default: return status;
    }
}

export default function HealthCheck() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    async function loadHealth() {
        setRefreshing(true);
        setError("");
        try {
            const { data } = await api.get<HealthResponse>("/admin/health");
            setHealth(data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Error obteniendo estado de salud");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadHealth();
        const interval = setInterval(loadHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="hc-wrap">
                <div className="hc-loading">
                    <FaSync className="hc-loading-icon spinning" />
                    <span>Verificando estado de servicios...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="hc-wrap">
                <div className="hc-error-box">
                    <FaTimesCircle className="hc-error-icon" />
                    <div>
                        <strong>Error de conexión</strong>
                        <p>{error}</p>
                    </div>
                    <button className="hc-btn" onClick={loadHealth}>Reintentar</button>
                </div>
            </div>
        );
    }

    if (!health) return <div className="hc-wrap">Sin datos disponibles</div>;

    // Agrupar servicios por categoría
    const categories: Record<string, Array<[string, ServiceStatus]>> = {};
    Object.entries(health.services).forEach(([key, svc]) => {
        const config = SERVICE_CONFIG[key];
        const cat = config?.category || "Otros";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push([key, svc]);
    });

    // Contar estados
    const counts = { ok: 0, error: 0, warning: 0, disabled: 0 };
    Object.values(health.services).forEach(s => {
        counts[s.status] = (counts[s.status] || 0) + 1;
    });
    const total = Object.values(health.services).length;

    return (
        <div className="hc-wrap">
            {/* Header */}
            <div className="hc-header">
                <div className="hc-header-left">
                    <div className="hc-header-icon">
                        <FaNetworkWired />
                    </div>
                    <div>
                        <h1 className="hc-title">Estado del Sistema</h1>
                        <p className="hc-subtitle">Monitoreo en tiempo real de servicios y conexiones</p>
                    </div>
                </div>
                <div className="hc-header-right">
                    <span className="hc-env-badge">{health.environment.toUpperCase()}</span>
                    <button className="hc-btn hc-btn-refresh" onClick={loadHealth} disabled={refreshing}>
                        <FaSync className={refreshing ? "spinning" : ""} />
                        {refreshing ? "Verificando..." : "Actualizar"}
                    </button>
                </div>
            </div>

            {/* Overall Status Card */}
            <div className={`hc-overall hc-overall-${health.status}`}>
                <div className="hc-overall-main">
                    <div className="hc-overall-icon">
                        {health.status === "healthy" && <FaCheckCircle />}
                        {health.status === "degraded" && <FaExclamationTriangle />}
                        {health.status === "unhealthy" && <FaTimesCircle />}
                    </div>
                    <div className="hc-overall-info">
                        <div className="hc-overall-status">
                            {health.status === "healthy" && "Todos los sistemas operativos"}
                            {health.status === "degraded" && "Algunos servicios con problemas"}
                            {health.status === "unhealthy" && "Sistema con fallas críticas"}
                        </div>
                        <div className="hc-overall-time">
                            Última verificación: {formatTimestamp(health.timestamp)}
                        </div>
                    </div>
                </div>
                <div className="hc-overall-stats">
                    <div className="hc-stat hc-stat-ok">
                        <span className="hc-stat-num">{counts.ok}</span>
                        <span className="hc-stat-label">Operativos</span>
                    </div>
                    <div className="hc-stat hc-stat-warn">
                        <span className="hc-stat-num">{counts.warning}</span>
                        <span className="hc-stat-label">Advertencias</span>
                    </div>
                    <div className="hc-stat hc-stat-err">
                        <span className="hc-stat-num">{counts.error}</span>
                        <span className="hc-stat-label">Errores</span>
                    </div>
                </div>
            </div>

            {/* Services by Category */}
            {Object.entries(categories).map(([catName, services]) => (
                <div key={catName} className="hc-category">
                    <h2 className="hc-cat-title">{catName}</h2>
                    <div className="hc-services-grid">
                        {services.map(([key, svc]) => {
                            const config = SERVICE_CONFIG[key] || {
                                label: key,
                                icon: <FaServer />,
                                description: ""
                            };
                            return (
                                <div key={key} className={`hc-service hc-service-${svc.status}`}>
                                    <div className="hc-service-header">
                                        <div className="hc-service-icon">{config.icon}</div>
                                        <div className="hc-service-meta">
                                            <div className="hc-service-name">{config.label}</div>
                                            <div className="hc-service-desc">{config.description}</div>
                                        </div>
                                        <div className={`hc-service-badge hc-badge-${svc.status}`}>
                                            <StatusIcon status={svc.status} />
                                            <span>{getStatusLabel(svc.status)}</span>
                                        </div>
                                    </div>
                                    <div className="hc-service-body">
                                        <div className="hc-service-message">{svc.message}</div>
                                        {(svc.host || svc.database || svc.model || svc.url) && (
                                            <div className="hc-service-details">
                                                {svc.database && (
                                                    <div className="hc-detail">
                                                        <span className="hc-detail-key">Base de datos:</span>
                                                        <span className="hc-detail-val">{svc.database}</span>
                                                    </div>
                                                )}
                                                {svc.model && (
                                                    <div className="hc-detail">
                                                        <span className="hc-detail-key">Modelo:</span>
                                                        <span className="hc-detail-val">{svc.model}</span>
                                                    </div>
                                                )}
                                                {svc.host && (
                                                    <div className="hc-detail">
                                                        <span className="hc-detail-key">Host:</span>
                                                        <span className="hc-detail-val mono">{svc.host}</span>
                                                    </div>
                                                )}
                                                {svc.url && (
                                                    <div className="hc-detail">
                                                        <span className="hc-detail-key">URL:</span>
                                                        <span className="hc-detail-val mono">{svc.url}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
