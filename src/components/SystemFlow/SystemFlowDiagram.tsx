import React, { useEffect, useState } from 'react';
import './SystemFlowDiagram.css';
import { FaHospital, FaDatabase, FaServer, FaBrain, FaUserMd, FaFileMedicalAlt, FaBuilding, FaGraduationCap, FaCheckCircle, FaSearch, FaLightbulb, FaSyncAlt } from 'react-icons/fa';
import api from '@/api/axios';

// Types
interface TenantInfo {
    id: string;
    code: string;
    name: string;
    integration_type: string;
    is_active: boolean;
}

const SystemFlowDiagram: React.FC = () => {
    const [tenants, setTenants] = useState<TenantInfo[]>([]);
    const [selectedTenant, setSelectedTenant] = useState<string>("markey");
    const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);

    // Fetch tenants
    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const res = await api.get("/admin/tenants?include_inactive=false");
                setTenants(res.data);
                if (res.data.length > 0 && !selectedTenant) {
                    setSelectedTenant(res.data[0].code);
                }
            } catch (err) {
                console.error("Error fetching tenants:", err);
            }
        };
        fetchTenants();
    }, []);

    useEffect(() => {
        const tenant = tenants.find(t => t.code === selectedTenant);
        setTenantInfo(tenant || null);
    }, [selectedTenant, tenants]);

    const getIntegrationLabel = (type: string) => {
        switch (type) {
            case "inbound": return "⬇️ Entrante";
            case "outbound": return "⬆️ Saliente";
            case "bidirectional": return "↔️ Bidireccional";
            default: return type;
        }
    };

    return (
        <div className="flow-container">
            {/* TENANT SELECTOR */}
            <div className="tenant-selector-section">
                <div className="tenant-selector-header">
                    <FaBuilding className="icon" />
                    <h3>Flujo Multi-Tenant</h3>
                </div>
                <div className="tenant-selector-controls">
                    <select
                        value={selectedTenant}
                        onChange={(e) => setSelectedTenant(e.target.value)}
                        className="tenant-select"
                    >
                        {tenants.map(t => (
                            <option key={t.code} value={t.code}>
                                {t.name} ({t.code})
                            </option>
                        ))}
                    </select>
                    {tenantInfo && (
                        <div className="tenant-info-badge">
                            <span className={`integration-type ${tenantInfo.integration_type}`}>
                                {getIntegrationLabel(tenantInfo.integration_type)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* =====================================================
                MAIN GENERATION FLOW - FERRO STACK
            ===================================================== */}
            <div className="diagram-wrapper">
                <div className="diagram-title">
                    <span className="title-icon">⚡</span>
                    <h4>Flujo FERRO - Generación de EPC</h4>
                </div>
                <svg viewBox="0 0 1000 520" className="flow-svg" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <marker id="arrow-grey" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <path d="M0,0 L6,3 L0,6" fill="none" stroke="#94a3b8" strokeWidth="1" />
                        </marker>
                        <marker id="arrow-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <path d="M0,0 L6,3 L0,6" fill="#10b981" />
                        </marker>
                        <filter id="shadow-md">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.1" />
                        </filter>
                        <linearGradient id="grad-stage-1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f0fdf4" />
                            <stop offset="100%" stopColor="#dcfce7" />
                        </linearGradient>
                        <linearGradient id="grad-stage-2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#eff6ff" />
                            <stop offset="100%" stopColor="#dbeafe" />
                        </linearGradient>
                        <linearGradient id="grad-stage-3" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fef3c7" />
                            <stop offset="100%" stopColor="#fde68a" />
                        </linearGradient>
                    </defs>

                    {/* Zones */}
                    <rect x="20" y="30" width="240" height="460" rx="20" fill="url(#grad-stage-1)" stroke="#bbf7d0" strokeWidth="1" />
                    <text x="140" y="60" textAnchor="middle" fill="#15803d" fontWeight="600" fontSize="12" letterSpacing="1">1. ENTRADA</text>

                    <rect x="280" y="30" width="280" height="460" rx="20" fill="url(#grad-stage-2)" stroke="#bfdbfe" strokeWidth="1" />
                    <text x="420" y="60" textAnchor="middle" fill="#1d4ed8" fontWeight="600" fontSize="12" letterSpacing="1">2. FERRO STACK</text>

                    <rect x="580" y="30" width="200" height="460" rx="20" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="1" />
                    <text x="680" y="60" textAnchor="middle" fill="#7e22ce" fontWeight="600" fontSize="12" letterSpacing="1">3. IA</text>

                    <rect x="800" y="30" width="180" height="460" rx="20" fill="url(#grad-stage-3)" stroke="#fcd34d" strokeWidth="1" />
                    <text x="890" y="60" textAnchor="middle" fill="#b45309" fontWeight="600" fontSize="12" letterSpacing="1">4. SALIDA</text>

                    {/* Node 1: Tenant/HCE */}
                    <foreignObject x="40" y="90" width="200" height="70">
                        <div className="node-card node-tenant">
                            <div className="node-icon bg-blue-100 text-blue-600"><FaBuilding /></div>
                            <div className="node-content">
                                <span className="node-title">{tenantInfo?.name || "Hospital"}</span>
                                <span className="node-sub">HCE Markey OCI</span>
                            </div>
                        </div>
                    </foreignObject>

                    {/* Node 2: FastAPI */}
                    <foreignObject x="40" y="180" width="200" height="55">
                        <div className="node-simple bg-teal-600 text-white shadow-md">
                            <FaServer size={14} />
                            <span>FastAPI :8000</span>
                        </div>
                    </foreignObject>

                    {/* FERRO DATABASES */}
                    {/* PostgreSQL */}
                    <foreignObject x="300" y="90" width="120" height="65">
                        <div className="node-db postgres">
                            <FaDatabase size={16} />
                            <span>PostgreSQL</span>
                            <code>:5432</code>
                        </div>
                    </foreignObject>

                    {/* Redis */}
                    <foreignObject x="440" y="90" width="100" height="65">
                        <div className="node-db redis">
                            <FaServer size={16} />
                            <span>Redis</span>
                            <code>:6379</code>
                        </div>
                    </foreignObject>

                    {/* MongoDB */}
                    <foreignObject x="300" y="175" width="120" height="65">
                        <div className="node-db mongo">
                            <FaDatabase size={16} />
                            <span>MongoDB</span>
                            <code>:27017</code>
                        </div>
                    </foreignObject>

                    {/* Qdrant */}
                    <foreignObject x="440" y="175" width="100" height="65">
                        <div className="node-db qdrant">
                            <FaBrain size={16} />
                            <span>Qdrant</span>
                            <code>:6333</code>
                        </div>
                    </foreignObject>

                    {/* Rust Engine */}
                    <foreignObject x="320" y="270" width="200" height="55">
                        <div className="node-rust">
                            <span className="rust-icon">🦀</span>
                            <span>Rust Engine (ainstein_core)</span>
                        </div>
                    </foreignObject>

                    {/* Data Labels */}
                    <text x="360" y="360" fill="#64748b" fontSize="10">Users, Auth</text>
                    <text x="445" y="360" fill="#64748b" fontSize="10">Cache</text>
                    <text x="360" y="380" fill="#64748b" fontSize="10">HCE, EPCs</text>
                    <text x="445" y="380" fill="#64748b" fontSize="10">Vectors</text>

                    {/* LangChain */}
                    <foreignObject x="600" y="100" width="160" height="60">
                        <div className="node-langchain">
                            <span>🦜🔗</span>
                            <span>LangChain</span>
                        </div>
                    </foreignObject>

                    {/* Gemini */}
                    <foreignObject x="600" y="180" width="160" height="55">
                        <div className="node-tool bg-indigo-100 border-indigo-200 text-indigo-700">
                            <FaBrain /> Gemini 2.0
                        </div>
                    </foreignObject>

                    {/* RAG */}
                    <foreignObject x="600" y="260" width="160" height="50">
                        <div className="node-rag">
                            <FaSearch size={14} />
                            <span>RAG Few-Shot</span>
                        </div>
                    </foreignObject>

                    {/* EPC Result */}
                    <foreignObject x="820" y="100" width="140" height="80">
                        <div className="node-result-large bg-emerald-500 text-white shadow-lg">
                            <FaFileMedicalAlt size={24} />
                            <div>
                                <div className="font-bold">EPC</div>
                                <div className="text-sm opacity-90">Generado</div>
                            </div>
                        </div>
                    </foreignObject>

                    {/* Doctor Review */}
                    <foreignObject x="820" y="200" width="140" height="70">
                        <div className="node-user bg-white border-amber-300 shadow-sm text-amber-700">
                            <FaUserMd size={20} />
                            <div>
                                <span className="block font-bold">Médico</span>
                                <span className="text-xs">Revisa</span>
                            </div>
                        </div>
                    </foreignObject>

                    {/* Feedback */}
                    <foreignObject x="820" y="290" width="140" height="50">
                        <div className="node-feedback">
                            <FaCheckCircle size={14} />
                            <span>Feedback</span>
                        </div>
                    </foreignObject>

                    {/* Connections */}
                    <path id="flow-1" d="M 140 160 L 140 180" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4" />
                    <path d="M 240 207 L 300 127" stroke="#0ea5e9" strokeWidth="2" />
                    <path d="M 240 207 L 300 207" stroke="#10b981" strokeWidth="2" />
                    <path d="M 420 155 L 420 175" stroke="#cbd5e1" strokeWidth="2" />
                    <path d="M 420 240 L 420 270" stroke="#ef4444" strokeWidth="2" />
                    <path id="flow-2" d="M 520 297 L 600 280" stroke="#8b5cf6" strokeWidth="2" />
                    <path d="M 540 140 L 600 130" stroke="#cbd5e1" strokeWidth="2" />
                    <path id="flow-3" d="M 680 160 L 680 180" stroke="#6366f1" strokeWidth="2" />
                    <path id="flow-4" d="M 760 130 L 820 130" stroke="#10b981" strokeWidth="3" />
                    <path d="M 890 180 L 890 200" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4" />
                    <path d="M 890 270 L 890 290" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4" />

                    {/* Loop back to MongoDB */}
                    <path d="M 820 315 C 700 350, 500 400, 360 240" stroke="#9333ea" strokeWidth="2" strokeDasharray="4" fill="none" />
                    <text x="580" y="420" fill="#9333ea" fontSize="10">Learning Loop</text>

                    {/* Animations */}
                    <circle r="5" fill="#0f172a">
                        <animateMotion repeatCount="indefinite" dur="2s">
                            <mpath href="#flow-1" />
                        </animateMotion>
                    </circle>
                    <circle r="4" fill="#8b5cf6">
                        <animateMotion repeatCount="indefinite" dur="1.5s" begin="0.5s">
                            <mpath href="#flow-2" />
                        </animateMotion>
                    </circle>
                    <circle r="4" fill="#6366f1">
                        <animateMotion repeatCount="indefinite" dur="1s" begin="1s">
                            <mpath href="#flow-3" />
                        </animateMotion>
                    </circle>
                    <circle r="6" fill="#10b981">
                        <animateMotion repeatCount="indefinite" dur="2s" begin="1.5s">
                            <mpath href="#flow-4" />
                        </animateMotion>
                    </circle>
                </svg>

                <div className="flow-footer">
                    <div className="flow-stat"><span className="dot bg-sky-500"></span> PostgreSQL</div>
                    <div className="flow-stat"><span className="dot bg-amber-500"></span> Redis</div>
                    <div className="flow-stat"><span className="dot bg-emerald-500"></span> MongoDB</div>
                    <div className="flow-stat"><span className="dot bg-purple-500"></span> Qdrant + RAG</div>
                    <div className="flow-stat"><span className="dot bg-red-500"></span> Rust</div>
                </div>
            </div>

            {/* =====================================================
                CONTINUOUS LEARNING FLOW (Interactivo)
            ===================================================== */}
            <div className="learning-flow-section">
                <div className="diagram-title learning-title">
                    <FaGraduationCap className="title-icon-react" />
                    <h4>Flujo de Aprendizaje Continuo</h4>
                    <span className="learning-badge">RAG + Feedback</span>
                </div>

                <svg viewBox="0 0 1000 400" className="flow-svg learning-svg" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="grad-learn-1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#faf5ff" />
                            <stop offset="100%" stopColor="#f3e8ff" />
                        </linearGradient>
                        <marker id="arrow-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <path d="M0,0 L6,3 L0,6" fill="#9333ea" />
                        </marker>
                    </defs>

                    {/* Background */}
                    <rect x="10" y="10" width="980" height="380" rx="20" fill="url(#grad-learn-1)" stroke="#e9d5ff" strokeWidth="1" />

                    {/* Step Labels */}
                    <text x="130" y="45" textAnchor="middle" fill="#7e22ce" fontWeight="600" fontSize="11">PASO 1</text>
                    <text x="340" y="45" textAnchor="middle" fill="#7e22ce" fontWeight="600" fontSize="11">PASO 2</text>
                    <text x="560" y="45" textAnchor="middle" fill="#7e22ce" fontWeight="600" fontSize="11">PASO 3</text>
                    <text x="780" y="45" textAnchor="middle" fill="#7e22ce" fontWeight="600" fontSize="11">PASO 4</text>

                    {/* Node 1: Doctor Approves */}
                    <foreignObject x="40" y="70" width="180" height="100">
                        <div className="learn-node step-1">
                            <div className="learn-icon"><FaCheckCircle /></div>
                            <div className="learn-text">
                                <strong>Médico Aprueba</strong>
                                <span>EPC validado ✓</span>
                            </div>
                        </div>
                    </foreignObject>

                    {/* Node 2: Embedding */}
                    <foreignObject x="250" y="70" width="180" height="100">
                        <div className="learn-node step-2">
                            <div className="learn-icon"><FaBrain /></div>
                            <div className="learn-text">
                                <strong>Vectorización</strong>
                                <span>Convierte a embeddings</span>
                            </div>
                        </div>
                    </foreignObject>

                    {/* Node 3: Qdrant Store */}
                    <foreignObject x="470" y="70" width="180" height="100">
                        <div className="learn-node step-3">
                            <div className="learn-icon"><FaDatabase /></div>
                            <div className="learn-text">
                                <strong>Almacena</strong>
                                <span>Qdrant Vector DB</span>
                            </div>
                        </div>
                    </foreignObject>

                    {/* Node 4: Available */}
                    <foreignObject x="690" y="70" width="180" height="100">
                        <div className="learn-node step-4">
                            <div className="learn-icon"><FaLightbulb /></div>
                            <div className="learn-text">
                                <strong>Disponible</strong>
                                <span>Para futuras EPCs</span>
                            </div>
                        </div>
                    </foreignObject>

                    {/* Connections Top Row */}
                    <path id="learn-1" d="M 220 120 L 250 120" stroke="#9333ea" strokeWidth="3" markerEnd="url(#arrow-purple)" />
                    <path id="learn-2" d="M 430 120 L 470 120" stroke="#9333ea" strokeWidth="3" markerEnd="url(#arrow-purple)" />
                    <path id="learn-3" d="M 650 120 L 690 120" stroke="#9333ea" strokeWidth="3" markerEnd="url(#arrow-purple)" />

                    {/* Feedback Loop - Bottom */}
                    <text x="500" y="220" textAnchor="middle" fill="#7e22ce" fontWeight="600" fontSize="11">CICLO DE MEJORA</text>

                    {/* Node 5: New Request */}
                    <foreignObject x="690" y="250" width="180" height="90">
                        <div className="learn-node step-5">
                            <div className="learn-icon"><FaFileMedicalAlt /></div>
                            <div className="learn-text">
                                <strong>Nueva Solicitud</strong>
                                <span>Genera otro EPC</span>
                            </div>
                        </div>
                    </foreignObject>

                    {/* Node 6: Search Similar */}
                    <foreignObject x="410" y="250" width="180" height="90">
                        <div className="learn-node step-6">
                            <div className="learn-icon"><FaSearch /></div>
                            <div className="learn-text">
                                <strong>Busca Similares</strong>
                                <span>En base de conocimiento</span>
                            </div>
                        </div>
                    </foreignObject>

                    {/* Node 7: Uses Examples */}
                    <foreignObject x="130" y="250" width="180" height="90">
                        <div className="learn-node step-7">
                            <div className="learn-icon"><FaSyncAlt /></div>
                            <div className="learn-text">
                                <strong>Usa Ejemplos</strong>
                                <span>Few-shot learning</span>
                            </div>
                        </div>
                    </foreignObject>

                    {/* Connections Bottom Row (Reverse) */}
                    <path id="learn-4" d="M 690 295 L 590 295" stroke="#9333ea" strokeWidth="2" strokeDasharray="4" markerEnd="url(#arrow-purple)" />
                    <path id="learn-5" d="M 410 295 L 310 295" stroke="#9333ea" strokeWidth="2" strokeDasharray="4" markerEnd="url(#arrow-purple)" />

                    {/* Closing the loop */}
                    <path id="learn-loop" d="M 130 295 C 50 295, 50 120, 130 120" fill="none" stroke="#9333ea" strokeWidth="2" strokeDasharray="4" />

                    {/* Animations */}
                    <circle r="5" fill="#a855f7">
                        <animateMotion repeatCount="indefinite" dur="1s">
                            <mpath href="#learn-1" />
                        </animateMotion>
                    </circle>
                    <circle r="5" fill="#a855f7">
                        <animateMotion repeatCount="indefinite" dur="1s" begin="0.3s">
                            <mpath href="#learn-2" />
                        </animateMotion>
                    </circle>
                    <circle r="5" fill="#a855f7">
                        <animateMotion repeatCount="indefinite" dur="1s" begin="0.6s">
                            <mpath href="#learn-3" />
                        </animateMotion>
                    </circle>
                    <circle r="4" fill="#c084fc">
                        <animateMotion repeatCount="indefinite" dur="1.5s" begin="1s">
                            <mpath href="#learn-4" />
                        </animateMotion>
                    </circle>
                    <circle r="4" fill="#c084fc">
                        <animateMotion repeatCount="indefinite" dur="1.5s" begin="1.5s">
                            <mpath href="#learn-5" />
                        </animateMotion>
                    </circle>
                    <circle r="4" fill="#e879f9">
                        <animateMotion repeatCount="indefinite" dur="3s" begin="2s">
                            <mpath href="#learn-loop" />
                        </animateMotion>
                    </circle>
                </svg>

                <div className="flow-footer learning-footer">
                    <div className="flow-stat"><span className="dot bg-purple-500"></span> Flujo de aprendizaje</div>
                    <div className="flow-stat"><span className="dot bg-purple-300"></span> Ciclo de retroalimentación</div>
                    <div className="flow-stat"><span className="dot bg-pink-400"></span> Mejora continua</div>
                </div>

                {/* Explanation Cards */}
                <div className="learning-explanation">
                    <div className="explain-card">
                        <span className="explain-num">1</span>
                        <p>Cada EPC <strong>aprobado por un médico</strong> se convierte en un ejemplo de calidad.</p>
                    </div>
                    <div className="explain-card">
                        <span className="explain-num">2</span>
                        <p>El sistema lo <strong>vectoriza y almacena</strong> en la base de conocimiento.</p>
                    </div>
                    <div className="explain-card">
                        <span className="explain-num">3</span>
                        <p>Cuando llega una nueva solicitud, <strong>busca casos similares</strong> ya aprobados.</p>
                    </div>
                    <div className="explain-card">
                        <span className="explain-num">4</span>
                        <p>Usa esos ejemplos para <strong>generar EPCs de mejor calidad</strong>.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemFlowDiagram;
