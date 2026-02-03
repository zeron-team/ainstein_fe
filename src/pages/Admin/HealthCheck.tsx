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
    FaProjectDiagram,
    FaListAlt,
    FaShieldAlt,
    FaLock,
    FaKey,
    FaUserShield
} from "react-icons/fa";

import "./HealthCheck.css";
// Import Diagram Component
import SystemFlowDiagram from "../../components/SystemFlow/SystemFlowDiagram";

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
    docker: {
        label: "Docker",
        icon: <FaServer />,
        description: "Container Orchestration",
        category: "Infraestructura",
    },
    postgres: {
        label: "PostgreSQL",
        icon: <FaDatabase />,
        description: "Truth Layer :5432",
        category: "Bases de Datos",
    },
    redis: {
        label: "Redis",
        icon: <FaServer />,
        description: "Dopamine Layer :6379",
        category: "Infraestructura",
    },
    mongodb: {
        label: "MongoDB",
        icon: <FaDatabase />,
        description: "Flexible Store :27017",
        category: "Bases de Datos",
    },
    qdrant: {
        label: "Qdrant",
        icon: <FaBrain />,
        description: "Vector Brain :6333",
        category: "Bases de Datos",
    },
    rust_core: {
        label: "Rust Engine",
        icon: <FaServer />,
        description: "ainstein_core (PyO3)",
        category: "Processing",
    },
    gemini_api: {
        label: "Gemini API",
        icon: <FaBrain />,
        description: "gemini-2.0-flash",
        category: "Servicios IA",
    },
    langchain: {
        label: "LangChain",
        icon: <FaBrain />,
        description: "Orquestación IA + RAG",
        category: "Servicios IA",
    },
    ainstein_ws: {
        label: "Ainstein WS",
        icon: <FaCloud />,
        description: "Markey OCI (HCE)",
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
    const [activeTab, setActiveTab] = useState<"monitor" | "flow" | "security">("monitor");

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

    // Content Renderer
    const renderContent = () => {
        if (activeTab === "flow") {
            return <SystemFlowDiagram />;
        }

        if (activeTab === "security") {
            return (
                <div className="hc-security-wrap">
                    <div className="hc-security-header">
                        <FaShieldAlt className="hc-security-icon" />
                        <div>
                            <h2>Infraestructura FERRO</h2>
                            <p>Servicios monitoreados, puertos y conexiones del stack polyglot</p>
                        </div>
                    </div>

                    {/* Mapa de Servicios Monitoreados */}
                    <div className="hc-infra-section">
                        <h3><FaServer /> Servicios Monitoreados (/admin/health)</h3>
                        <div className="hc-services-map">
                            <div className="hc-service-box core">
                                <div className="hc-svc-header">
                                    <FaDatabase /> <span>PostgreSQL 15</span>
                                    <code>:5432</code>
                                </div>
                                <div className="hc-svc-body">
                                    <div className="hc-svc-label">Truth Layer</div>
                                    <ul>
                                        <li>Users, Tenants, Auth</li>
                                        <li>SQLAlchemy ORM</li>
                                        <li>Container: <code>ferro_postgres</code></li>
                                    </ul>
                                </div>
                            </div>

                            <div className="hc-service-box cache">
                                <div className="hc-svc-header">
                                    <FaServer /> <span>Redis 7</span>
                                    <code>:6379</code>
                                </div>
                                <div className="hc-svc-body">
                                    <div className="hc-svc-label">Dopamine Layer</div>
                                    <ul>
                                        <li>Session cache</li>
                                        <li>Rate limiting</li>
                                        <li>Container: <code>ferro_redis</code></li>
                                    </ul>
                                </div>
                            </div>

                            <div className="hc-service-box flex">
                                <div className="hc-svc-header">
                                    <FaDatabase /> <span>MongoDB 6</span>
                                    <code>:27017</code>
                                </div>
                                <div className="hc-svc-body">
                                    <div className="hc-svc-label">Flexible Store</div>
                                    <ul>
                                        <li>HCE Docs, EPCs, Feedback</li>
                                        <li>motor async driver</li>
                                        <li>Container: <code>ferro_mongo</code></li>
                                    </ul>
                                </div>
                            </div>

                            <div className="hc-service-box vector">
                                <div className="hc-svc-header">
                                    <FaBrain /> <span>Qdrant</span>
                                    <code>:6333</code>
                                </div>
                                <div className="hc-svc-body">
                                    <div className="hc-svc-label">Vector Brain</div>
                                    <ul>
                                        <li>Embeddings RAG</li>
                                        <li>qdrant-client</li>
                                        <li>Container: <code>ferro_qdrant</code></li>
                                    </ul>
                                </div>
                            </div>

                            <div className="hc-service-box rust">
                                <div className="hc-svc-header">
                                    <FaServer /> <span>Rust Engine</span>
                                    <code>.so</code>
                                </div>
                                <div className="hc-svc-body">
                                    <div className="hc-svc-label">ainstein_core</div>
                                    <ul>
                                        <li>PyO3 bindings</li>
                                        <li>Text processing</li>
                                        <li>High-performance compute</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="hc-service-box external">
                                <div className="hc-svc-header">
                                    <FaBrain /> <span>Gemini API</span>
                                    <code>HTTPS</code>
                                </div>
                                <div className="hc-svc-body">
                                    <div className="hc-svc-label">Google AI</div>
                                    <ul>
                                        <li>gemini-2.0-flash</li>
                                        <li>LangChain orchestration</li>
                                        <li>EPC generation</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="hc-service-box external">
                                <div className="hc-svc-header">
                                    <FaCloud /> <span>Ainstein WS</span>
                                    <code>HTTPS</code>
                                </div>
                                <div className="hc-svc-body">
                                    <div className="hc-svc-label">Markey OCI</div>
                                    <ul>
                                        <li>HCE inbound integration</li>
                                        <li>Clinical episodes</li>
                                        <li>External hospital data</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="hc-service-box api">
                                <div className="hc-svc-header">
                                    <FaServer /> <span>FastAPI</span>
                                    <code>:8000</code>
                                </div>
                                <div className="hc-svc-body">
                                    <div className="hc-svc-label">Backend API</div>
                                    <ul>
                                        <li>Uvicorn ASGI</li>
                                        <li>JWT Auth (HS256)</li>
                                        <li>Multi-tenant isolation</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Docker Compose */}
                    <div className="hc-infra-section">
                        <h3><FaProjectDiagram /> Docker Compose Stack</h3>
                        <div className="hc-docker-grid">
                            <div className="hc-docker-item">
                                <code>docker-compose.yml</code>
                                <span>4 servicios containerizados</span>
                            </div>
                            <div className="hc-docker-item">
                                <code>ferro_postgres</code>
                                <span>postgres:15-alpine</span>
                            </div>
                            <div className="hc-docker-item">
                                <code>ferro_redis</code>
                                <span>redis:7-alpine</span>
                            </div>
                            <div className="hc-docker-item">
                                <code>ferro_mongo</code>
                                <span>mongo:6.0</span>
                            </div>
                            <div className="hc-docker-item">
                                <code>ferro_qdrant</code>
                                <span>qdrant/qdrant:latest</span>
                            </div>
                        </div>
                    </div>

                    {/* Flujo de Autenticación */}
                    <div className="hc-security-flow">
                        <h3><FaLock /> Flujo de Autenticación</h3>
                        <div className="hc-security-steps">
                            <div className="hc-sec-step">
                                <div className="hc-sec-num">1</div>
                                <div className="hc-sec-content">
                                    <h5><FaKey /> Login</h5>
                                    <p>POST /auth/login → PostgreSQL (users)</p>
                                </div>
                            </div>
                            <div className="hc-sec-step">
                                <div className="hc-sec-num">2</div>
                                <div className="hc-sec-content">
                                    <h5><FaUserShield /> Verify</h5>
                                    <p>bcrypt hash + tenant_id load</p>
                                </div>
                            </div>
                            <div className="hc-sec-step">
                                <div className="hc-sec-num">3</div>
                                <div className="hc-sec-content">
                                    <h5><FaLock /> JWT</h5>
                                    <p>HS256 token (user_id, tenant_id, role)</p>
                                </div>
                            </div>
                            <div className="hc-sec-step final">
                                <div className="hc-sec-num final">✓</div>
                                <div className="hc-sec-content">
                                    <h5>Access</h5>
                                    <p>Bearer token → All protected endpoints</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stack Summary */}
                    <div className="hc-security-summary">
                        <div className="hc-sec-stat ok"><span>PostgreSQL</span> :5432</div>
                        <div className="hc-sec-stat ok"><span>Redis</span> :6379</div>
                        <div className="hc-sec-stat ok"><span>MongoDB</span> :27017</div>
                        <div className="hc-sec-stat ok"><span>Qdrant</span> :6333</div>
                        <div className="hc-sec-stat ok"><span>FastAPI</span> :8000</div>
                    </div>
                </div>
            );
        }

        // Monitor Tab - States
        if (loading) {
            return (
                <div className="hc-loading">
                    <FaSync className="hc-loading-icon spinning" />
                    <span>Verificando estado de servicios...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="hc-error-box">
                    <FaTimesCircle className="hc-error-icon" />
                    <div>
                        <strong>Error de conexión</strong>
                        <p>{error}</p>
                    </div>
                    <button className="hc-btn" onClick={loadHealth}>Reintentar</button>
                </div>
            );
        }

        if (!health) return <div className="hc-message">Sin datos disponibles</div>;

        // Agrupar servicios por categoría
        const categories: Record<string, Array<[string, ServiceStatus]>> = {};
        Object.entries(health.services).forEach(([key, svc]) => {
            const config = SERVICE_CONFIG[key];
            const cat = config?.category || "Otros";
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push([key, svc]);
        });

        // Contar estados
        const counts: Record<string, number> = { ok: 0, error: 0, warning: 0, disabled: 0 };
        Object.values(health.services).forEach(s => {
            counts[s.status] = (counts[s.status] || 0) + 1;
        });

        // Monitor Tab - Data
        return (
            <>
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
            </>
        );
    };

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
                        <p className="hc-subtitle">Monitoreo FERRO Stack y Flujo de Datos</p>
                    </div>
                </div>
                <div className="hc-header-right">
                    <span className="hc-env-badge">{health ? health.environment.toUpperCase() : "..."}</span>
                    <button className="hc-btn hc-btn-refresh" onClick={loadHealth} disabled={refreshing}>
                        <FaSync className={refreshing ? "spinning" : ""} />
                        {refreshing ? "Verificando..." : "Actualizar"}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="hc-tabs">
                <button
                    className={`hc-tab ${activeTab === "monitor" ? "active" : ""}`}
                    onClick={() => setActiveTab("monitor")}
                >
                    <FaListAlt /> Monitoreo
                </button>
                <button
                    className={`hc-tab ${activeTab === "flow" ? "active" : ""}`}
                    onClick={() => setActiveTab("flow")}
                >
                    <FaProjectDiagram /> Flujo Interactivo
                </button>
                <button
                    className={`hc-tab ${activeTab === "security" ? "active" : ""}`}
                    onClick={() => setActiveTab("security")}
                >
                    <FaShieldAlt /> Seguridad
                </button>
            </div>

            {/* Content Area */}
            <div className="hc-content">
                {renderContent()}
            </div>
        </div>
    );
}
