// src/pages/Admin/GoldenRules.tsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    FaBookOpen,
    FaPen,
    FaSave,
    FaPlus,
    FaTrash,
    FaTimes,
    FaShieldAlt,
    FaExclamationTriangle,
    FaCheckCircle,
    FaLightbulb,
    FaGraduationCap,
    FaInfoCircle,
    FaCog,
    FaSearch,
    FaPills,
    FaClipboardList,
    FaStethoscope,
    FaNotesMedical,
    FaHospital,
    FaFileMedical,
    FaListAlt,
    FaArrowRight,
    FaLayerGroup,
} from "react-icons/fa";
import api from "@/api/axios";
import { useAuth } from "@/auth/AuthContext";
import "./GoldenRules.css";

interface AuditEntry {
    action: string;
    type: string;
    by: string;
    at: string;
    correction_id?: string;
    patient_id?: string;
}

interface RuleItem {
    id?: string;
    text: string;
    priority: "critica" | "alta" | "normal";
    active: boolean;
    source?: string;
    frequency?: number;
    item_name?: string;
    from_sections_labels?: string[];
    target_section_label?: string;
    processed?: boolean;
    processed_at?: string;
    processed_by?: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    audit_log?: AuditEntry[];
    contributors?: string[];
}

interface RuleSection {
    key: string;
    title: string;
    rules: RuleItem[];
    updated_at?: string;
    updated_by?: string;
}

const PRIORITY_LABELS: Record<string, string> = {
    critica: "Crítica",
    alta: "Alta",
    normal: "Normal",
};

const SECTION_ICONS: Record<string, JSX.Element> = {
    core: <FaLayerGroup />,
    motivo: <FaShieldAlt />,
    motivo_internacion: <FaHospital />,
    evolucion: <FaBookOpen />,
    procedimientos: <FaCheckCircle />,
    estudios: <FaFileMedical />,
    interconsultas: <FaStethoscope />,
    medicacion: <FaPills />,
    indicaciones_alta: <FaClipboardList />,
    recomendaciones: <FaNotesMedical />,
    obito: <FaExclamationTriangle />,
    pdf: <FaBookOpen />,
    learned: <FaGraduationCap />,
};

const PRIO_ORDER: Record<string, number> = { critica: 0, alta: 1, normal: 2 };

export default function GoldenRules() {
    const [sections, setSections] = useState<RuleSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [editRules, setEditRules] = useState<RuleItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [addingTo, setAddingTo] = useState<string | null>(null);
    const [newRuleText, setNewRuleText] = useState("");
    const [newRulePriority, setNewRulePriority] = useState<"critica" | "alta" | "normal">("normal");
    const [showInfo, setShowInfo] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("todos");
    const [filterPriority, setFilterPriority] = useState<string>("all");
    const [searchText, setSearchText] = useState<string>("");

    const { user } = useAuth();
    const [ruleTracking, setRuleTracking] = useState<Record<string, "leido" | "revisar">>({});

    useEffect(() => {
        if (user?.id) {
            const saved = localStorage.getItem(`golden_rules_tracking_${user.id}`);
            if (saved) {
                try { setRuleTracking(JSON.parse(saved)); } catch (e) {}
            }
        }
    }, [user?.id]);

    const toggleRuleTracking = (ruleText: string, status: "leido" | "revisar") => {
        setRuleTracking(prev => {
            const next = { ...prev };
            if (next[ruleText] === status) {
                delete next[ruleText];
            } else {
                next[ruleText] = status;
            }
            if (user?.id) {
                localStorage.setItem(`golden_rules_tracking_${user.id}`, JSON.stringify(next));
            }
            return next;
        });
    };

    const fetchRules = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get("/api/admin/golden-rules");
            setSections(data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Error al cargar reglas");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRules(); }, [fetchRules]);

    // ─── Handlers ───
    const startEditing = (section: RuleSection) => {
        setEditingSection(section.key);
        setEditRules(section.rules.map((r) => ({ ...r })));
    };

    const cancelEditing = () => {
        setEditingSection(null);
        setEditRules([]);
    };

    const saveSection = async () => {
        if (!editingSection) return;
        setSaving(true);
        try {
            await api.put(`/api/admin/golden-rules/${editingSection}`, { rules: editRules });
            setToast("Reglas guardadas correctamente");
            setTimeout(() => setToast(null), 3000);
            setEditingSection(null);
            setEditRules([]);
            fetchRules();
        } catch (e: any) {
            setToast("Error al guardar: " + (e?.response?.data?.detail || e.message));
            setTimeout(() => setToast(null), 4000);
        } finally {
            setSaving(false);
        }
    };

    const handleEditRuleText = (idx: number, text: string) => {
        const updated = [...editRules];
        updated[idx] = { ...updated[idx], text };
        setEditRules(updated);
    };

    const handleEditRulePriority = (idx: number, priority: string) => {
        const updated = [...editRules];
        updated[idx] = { ...updated[idx], priority: priority as RuleItem["priority"] };
        setEditRules(updated);
    };

    const handleToggleActive = (idx: number) => {
        const updated = [...editRules];
        updated[idx] = { ...updated[idx], active: !updated[idx].active };
        setEditRules(updated);
    };

    const handleDeleteRule = (idx: number) => {
        setEditRules(editRules.filter((_, i) => i !== idx));
    };

    const handleAddEditRule = () => {
        setEditRules([...editRules, { text: "", priority: "normal", active: true }]);
    };

    const addRuleToSection = async (sectionKey: string) => {
        if (!newRuleText.trim()) return;
        try {
            await api.post(`/api/admin/golden-rules/${sectionKey}/add`, {
                text: newRuleText.trim(),
                priority: newRulePriority,
                active: true,
            });
            setToast("Regla agregada");
            setTimeout(() => setToast(null), 3000);
            setAddingTo(null);
            setNewRuleText("");
            setNewRulePriority("normal");
            fetchRules();
        } catch (e: any) {
            setToast("Error al agregar regla");
            setTimeout(() => setToast(null), 3000);
        }
    };

    const processSection = async (sectionKey: string) => {
        try {
            await api.post(`/api/admin/golden-rules/${sectionKey}/process`);
            setToast("Sección procesada ✓");
            setTimeout(() => setToast(null), 3000);
            fetchRules();
        } catch (e: any) {
            setToast("Error al procesar");
            setTimeout(() => setToast(null), 3000);
        }
    };

    // ─── Computed values ───
    const safeSections = Array.isArray(sections) ? sections : [];

    const totalRules = safeSections.reduce((sum, s) => sum + (s.rules?.length || 0), 0);
    const activeRules = safeSections.reduce((sum, s) => sum + (s.rules?.filter((r) => r.active)?.length || 0), 0);
    const processedRules = safeSections.reduce((sum, s) => sum + (s.rules?.filter((r) => r.processed)?.length || 0), 0);
    const learnedCount = safeSections.reduce((sum, s) => sum + (s.rules?.filter((r) => r.source === "learned_from_feedback" || r.source === "dictionary")?.length || 0), 0);
    const pendingCount = activeRules - processedRules > 0 ? activeRules - processedRules : 0;

    // Sections with pending rules (for KPI detail)
    const pendingBySec = useMemo(() => {
        return safeSections
            .map((s) => ({
                key: s.key,
                title: s.title,
                pending: s.rules?.filter((r) => r.active && !r.processed)?.length || 0,
            }))
            .filter((s) => s.pending > 0);
    }, [safeSections]);

    // Active section for tab content
    const activeSection = safeSections.find((s) => s.key === activeTab);

    // ─── Render helpers ───

    const renderEditMode = (sectionKey: string) => (
        <div className="gr-edit-list">
            {editRules.map((r, idx) => (
                <div key={idx} className="gr-edit-row">
                    <textarea
                        className="gr-edit-textarea"
                        value={r.text}
                        onChange={(e) => handleEditRuleText(idx, e.target.value)}
                        rows={3}
                    />
                    <div className="gr-edit-controls">
                        <select
                            className="gr-edit-priority"
                            value={r.priority}
                            onChange={(e) => handleEditRulePriority(idx, e.target.value)}
                        >
                            <option value="critica">Crítica</option>
                            <option value="alta">Alta</option>
                            <option value="normal">Normal</option>
                        </select>
                        <label className="gr-edit-toggle">
                            <input
                                type="checkbox"
                                checked={r.active}
                                onChange={() => handleToggleActive(idx)}
                            />
                            Activa
                        </label>
                        <button className="gr-btn gr-btn-delete" onClick={() => handleDeleteRule(idx)} title="Eliminar">
                            <FaTrash />
                        </button>
                    </div>
                </div>
            ))}
            <button className="gr-btn gr-btn-add-inline" onClick={handleAddEditRule}>
                <FaPlus /> Agregar regla
            </button>
        </div>
    );

    const renderQuickAdd = (sectionKey: string) => (
        <div className="gr-quick-add">
            <textarea
                className="gr-quick-input"
                placeholder="Escribir nueva regla..."
                value={newRuleText}
                onChange={(e) => setNewRuleText(e.target.value)}
                rows={2}
                autoFocus
            />
            <div className="gr-quick-actions">
                <select className="gr-edit-priority" value={newRulePriority} onChange={(e) => setNewRulePriority(e.target.value as RuleItem["priority"])}>
                    <option value="critica">Crítica</option>
                    <option value="alta">Alta</option>
                    <option value="normal">Normal</option>
                </select>
                <button className="gr-btn gr-btn-save" onClick={() => addRuleToSection(sectionKey)} disabled={!newRuleText.trim()}>
                    <FaSave /> Guardar
                </button>
                <button className="gr-btn gr-btn-cancel" onClick={() => setAddingTo(null)}>
                    <FaTimes />
                </button>
            </div>
        </div>
    );

    const renderRuleRow = (r: RuleItem, idx: number, showSectionLabel?: string) => {
        const ruleText = r.source === "dictionary" && r.item_name ? r.item_name : r.text;
        const trackingClass = ruleTracking[ruleText] ? `gr-rule-tracked-${ruleTracking[ruleText]}` : "";
        return (
        <div key={idx} className={`gr-rule ${!r.active ? "gr-inactive" : ""} ${r.source === "dictionary" ? "gr-rule-dict" : ""} ${trackingClass}`}>
            <span className={`gr-priority-dot priority-${r.priority}`} title={PRIORITY_LABELS[r.priority]} />
            <div className="gr-rule-content">
                <span className="gr-rule-number" style={{ fontWeight: "bold", marginRight: 8, color: "#94a3b8" }}>#{idx + 1}</span>
                {showSectionLabel && <span className="gr-all-rule-section">{showSectionLabel}</span>}
                
                {r.source === "dictionary" && r.item_name ? (
                    <div className="gr-dict-transition-container">
                        <span className="gr-rule-text">{r.item_name}</span>
                        <div className="gr-dict-flow">
                            {r.from_sections_labels && r.from_sections_labels.length > 0 && (
                                <>
                                    <span className="gr-flow-badge gr-flow-from">
                                        {r.from_sections_labels.join(", ")}
                                    </span>
                                    <FaArrowRight className="gr-flow-arrow" />
                                </>
                            )}
                            <span className={`gr-flow-badge gr-flow-to ${r.target_section_label === "EXCLUDE" ? "gr-flow-exclude" : ""}`}>
                                {r.target_section_label === "EXCLUDE" ? "Excluir de todas las secciones" : r.target_section_label}
                            </span>
                            <span className="gr-flow-freq">
                                (aprendido de {r.frequency} corrección{r.frequency !== 1 ? 'es' : ''})
                            </span>
                        </div>
                    </div>
                ) : (
                    <span className="gr-rule-text">{r.text}</span>
                )}

                {r.source === "learned_from_feedback" && <span className="gr-learned-badge">Aprendida</span>}
                {r.source === "dictionary" && <span className="gr-dict-badge">Diccionario</span>}
                {!r.processed && r.active && <span className="gr-pending-badge">Pendiente</span>}
                {!r.active && <span className="gr-disabled-badge">Inactiva</span>}
                {r.source === "dictionary" && (
                    <div className="gr-audit-info">
                        <span className="gr-audit-who">
                            {r.contributors && r.contributors.length > 1 ? (
                                <details className="gr-contributors-details">
                                    <summary className="gr-contributors-toggle">
                                        Por <strong>{r.contributors.length} usuarios</strong>
                                        {r.created_at && ` · desde ${new Date(r.created_at).toLocaleDateString("es-AR")}`}
                                    </summary>
                                    <ul className="gr-contributors-list">
                                        {r.contributors.map((name, i) => (
                                            <li key={i}>{name}</li>
                                        ))}
                                    </ul>
                                </details>
                            ) : (
                                <>
                                    Por <strong>{r.contributors?.[0] || r.created_by || "sistema"}</strong>
                                    {r.created_at && ` el ${new Date(r.created_at).toLocaleDateString("es-AR")}`}
                                </>
                            )}
                        </span>
                    </div>
                )}
            </div>

            <div className="gr-rule-tracking-actions" style={{ display: "flex", gap: "8px", marginLeft: "auto", alignSelf: "flex-start", marginTop: "4px" }}>
                <button 
                    onClick={() => toggleRuleTracking(ruleText, "leido")}
                    title="Marcar como leído"
                    style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "12px", border: "1px solid #e2e8f0", background: ruleTracking[ruleText] === 'leido' ? "#10b981" : "#fff", color: ruleTracking[ruleText] === 'leido' ? "#fff" : "#64748b", cursor: "pointer", fontWeight: ruleTracking[ruleText] === 'leido' ? 'bold' : 'normal', transition: "all 0.2s" }}
                >
                    ✓ Leído
                </button>
                <button 
                    onClick={() => toggleRuleTracking(ruleText, "revisar")}
                    title="Marcar para revisar"
                    style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "12px", border: "1px solid #e2e8f0", background: ruleTracking[ruleText] === 'revisar' ? "#f59e0b" : "#fff", color: ruleTracking[ruleText] === 'revisar' ? "#fff" : "#64748b", cursor: "pointer", fontWeight: ruleTracking[ruleText] === 'revisar' ? 'bold' : 'normal', transition: "all 0.2s" }}
                >
                    ⚑ Revisar
                </button>
            </div>
        </div>
    );
};

    // ─── "Todos" tab: flat list of all processed rules ───
    const renderAllRulesTab = () => {
        const searchLower = searchText.toLowerCase();
        const filtered = safeSections
            .flatMap((s) =>
                s.rules
                    .filter((r) =>
                        r.processed
                        && (filterPriority === "all" || r.priority === filterPriority)
                        && (!searchLower || r.text.toLowerCase().includes(searchLower))
                    )
                    .map((r) => ({ ...r, _sectionTitle: s.title }))
            )
            .sort((a, b) => (PRIO_ORDER[a.priority] ?? 9) - (PRIO_ORDER[b.priority] ?? 9));

        return (
            <div className="gr-tab-content">
                <div className="gr-tab-toolbar">
                    <div className="gr-filter gr-filter-search">
                        <FaSearch className="gr-filter-icon" />
                        <input
                            type="text"
                            className="gr-search-input"
                            placeholder="Buscar regla..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                    <div className="gr-filter">
                        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                            <option value="all">Todas las prioridades</option>
                            <option value="critica">🔴 Crítica</option>
                            <option value="alta">🟡 Alta</option>
                            <option value="normal">🟢 Normal</option>
                        </select>
                    </div>
                    <div className="gr-tab-result-count">{filtered.length} reglas</div>
                </div>
                <div className="gr-rule-scroll">
                    {filtered.length > 0 ? (
                        filtered.map((r, i) => renderRuleRow(r, i, r._sectionTitle))
                    ) : (
                        <div className="gr-empty">Sin reglas procesadas con ese filtro.</div>
                    )}
                </div>
            </div>
        );
    };

    // ─── Section tab: card with edit/add/process ───
    const renderSectionTab = (sec: RuleSection) => {
        const isEditing = editingSection === sec.key;
        const hasUnprocessed = sec.rules.some((r) => r.active && !r.processed);
        const searchLower = searchText.toLowerCase();

        const filteredRules = sec.rules.filter((r) =>
            (filterPriority === "all" || r.priority === filterPriority)
            && (!searchLower || r.text.toLowerCase().includes(searchLower))
        );

        return (
            <div className="gr-tab-content">
                {/* Toolbar */}
                <div className="gr-tab-toolbar">
                    <div className="gr-filter gr-filter-search">
                        <FaSearch className="gr-filter-icon" />
                        <input
                            type="text"
                            className="gr-search-input"
                            placeholder="Buscar regla..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                    <div className="gr-filter">
                        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                            <option value="all">Todas las prioridades</option>
                            <option value="critica">🔴 Crítica</option>
                            <option value="alta">🟡 Alta</option>
                            <option value="normal">🟢 Normal</option>
                        </select>
                    </div>
                    <div className="gr-tab-actions">
                        {isEditing ? (
                            <>
                                <button className="gr-btn gr-btn-save" onClick={saveSection} disabled={saving}>
                                    <FaSave /> {saving ? "..." : "Guardar"}
                                </button>
                                <button className="gr-btn gr-btn-cancel" onClick={cancelEditing}><FaTimes /></button>
                            </>
                        ) : (
                            <>
                                {hasUnprocessed && (
                                    <button className="gr-btn gr-btn-process" onClick={() => processSection(sec.key)} title="Procesar reglas pendientes">
                                        <FaCog /> Procesar
                                    </button>
                                )}
                                <button className="gr-btn gr-btn-edit" onClick={() => startEditing(sec)} title="Editar"><FaPen /> Editar</button>
                                <button className="gr-btn gr-btn-add" onClick={() => { setAddingTo(sec.key); setNewRuleText(""); }} title="Agregar"><FaPlus /> Agregar</button>
                            </>
                        )}
                    </div>
                </div>

                {/* Quick add */}
                {addingTo === sec.key && renderQuickAdd(sec.key)}

                {/* Edit mode */}
                {isEditing && renderEditMode(sec.key)}

                {/* View mode */}
                {!isEditing && (
                    <div className="gr-rule-scroll">
                        {filteredRules.length > 0 ? (
                            filteredRules.map((r, idx) => renderRuleRow(r, idx))
                        ) : (
                            <div className="gr-empty">Sin reglas con ese filtro.</div>
                        )}
                    </div>
                )}

                {sec.updated_at && (
                    <div className="gr-card-meta">
                        Editado: {new Date(sec.updated_at).toLocaleString("es-AR")} por {sec.updated_by || "sistema"}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="gr-page">
            {/* ── Header ── */}
            <div className="gr-header">
                <div>
                    <h1>
                        <FaLightbulb className="gr-header-icon" /> Reglas de Oro
                        <button className="gr-info-btn" onClick={() => setShowInfo(!showInfo)} title="Información de prioridades">
                            <FaInfoCircle />
                        </button>
                    </h1>
                    <p className="gr-subtitle">
                        Reglas que gobiernan la generación de Epicrisis por IA. Se inyectan directamente en el sistema.
                    </p>
                    {showInfo && (
                        <div className="gr-info-tooltip">
                            <div className="gr-info-row"><span className="gr-priority-dot priority-critica" /> <strong>Crítica:</strong> Regla obligatoria. Si no se cumple, el EPC tiene un error grave.</div>
                            <div className="gr-info-row"><span className="gr-priority-dot priority-alta" /> <strong>Alta:</strong> Regla importante que mejora la calidad. Se aplica siempre que sea posible.</div>
                            <div className="gr-info-row"><span className="gr-priority-dot priority-normal" /> <strong>Normal:</strong> Recomendación de buena práctica. Se aplica como guía general.</div>
                            <div className="gr-info-note">Solo las reglas <strong>procesadas</strong> se envían al modelo de IA. Editar o agregar reglas requiere hacer click en "Procesar".</div>
                        </div>
                    )}
                </div>
                <div className="gr-stats">
                    <div className="gr-stat">
                        <span className="gr-stat-num">{totalRules}</span>
                        <span className="gr-stat-label">Total</span>
                    </div>
                    <div className="gr-stat">
                        <span className="gr-stat-num gr-stat-green">{processedRules}</span>
                        <span className="gr-stat-label">Procesadas</span>
                    </div>
                    <div className="gr-stat gr-stat-pending-block">
                        <span className="gr-stat-num gr-stat-orange">{pendingCount}</span>
                        <span className="gr-stat-label">Pendientes</span>
                        {pendingBySec.length > 0 && (
                            <div className="gr-stat-pending-list">
                                {pendingBySec.map((s) => (
                                    <button
                                        key={s.key}
                                        className="gr-stat-pending-item"
                                        onClick={() => setActiveTab(s.key)}
                                        title={`Ver las ${s.pending} reglas pendientes en ${s.title}`}
                                    >
                                        <span className="gr-pending-dot" /> {s.pending} en {s.title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="gr-stat">
                        <span className="gr-stat-num gr-stat-blue">{learnedCount}</span>
                        <span className="gr-stat-label">Aprendidas</span>
                    </div>
                </div>
            </div>

            {error && <div className="gr-error">{error}</div>}

            {loading ? (
                <div className="gr-loading">Cargando reglas...</div>
            ) : (
                <>
                    {/* ── Tab Bar ── */}
                    <div className="gr-tabbar">
                        <button
                            className={`gr-tab ${activeTab === "todos" ? "gr-tab-active" : ""}`}
                            onClick={() => setActiveTab("todos")}
                        >
                            <FaListAlt className="gr-tab-icon" />
                            <span className="gr-tab-label">Todos</span>
                            <span className="gr-tab-count">{processedRules}</span>
                        </button>
                        {safeSections.map((sec) => {
                            const secPending = sec.rules?.filter((r) => r.active && !r.processed)?.length || 0;
                            return (
                                <button
                                    key={sec.key}
                                    className={`gr-tab ${activeTab === sec.key ? "gr-tab-active" : ""} ${secPending > 0 ? "gr-tab-has-pending" : ""}`}
                                    onClick={() => setActiveTab(sec.key)}
                                >
                                    <span className="gr-tab-icon">{SECTION_ICONS[sec.key] || <FaShieldAlt />}</span>
                                    <span className="gr-tab-label">{sec.title}</span>
                                    <span className="gr-tab-count">{sec.rules?.length || 0}</span>
                                    {secPending > 0 && <span className="gr-tab-pending-dot" title={`${secPending} pendientes`} />}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Tab Content ── */}
                    <div className="gr-tab-panel">
                        {activeTab === "todos" && renderAllRulesTab()}
                        {activeSection && renderSectionTab(activeSection)}
                    </div>
                </>
            )}

            {toast && <div className="gr-toast">{toast}</div>}
        </div>
    );
}
