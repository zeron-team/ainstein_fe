// src/pages/Admin/GoldenRules.tsx

import React, { useEffect, useState, useCallback } from "react";
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
    FaFilter,
    FaCog,
} from "react-icons/fa";
import api from "@/api/axios";
import "./GoldenRules.css";

interface RuleItem {
    id?: string;
    text: string;
    priority: "critica" | "alta" | "normal";
    active: boolean;
    source?: string;
    frequency?: number;
    processed?: boolean;
    processed_at?: string;
    processed_by?: string;
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
    motivo: <FaShieldAlt />,
    evolucion: <FaBookOpen />,
    procedimientos: <FaCheckCircle />,
    interconsultas: <FaCheckCircle />,
    medicacion: <FaCheckCircle />,
    obito: <FaExclamationTriangle />,
    pdf: <FaBookOpen />,
    learned: <FaGraduationCap />,
};

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
    const [filterSection, setFilterSection] = useState<string>("all");
    const [filterPriority, setFilterPriority] = useState<string>("all");

    const fetchRules = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get("/admin/golden-rules");
            setSections(data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Error al cargar reglas");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRules(); }, [fetchRules]);

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
            await api.put(`/admin/golden-rules/${editingSection}`, { rules: editRules });
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
            await api.post(`/admin/golden-rules/${sectionKey}/add`, {
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
            await api.post(`/admin/golden-rules/${sectionKey}/process`);
            setToast("Sección procesada ✓");
            setTimeout(() => setToast(null), 3000);
            fetchRules();
        } catch (e: any) {
            setToast("Error al procesar");
            setTimeout(() => setToast(null), 3000);
        }
    };

    // Separate applied vs learned
    const appliedSections = sections.filter((s) => s.key !== "learned");
    const learnedSection = sections.find((s) => s.key === "learned");

    const totalRules = sections.reduce((sum, s) => sum + s.rules.length, 0);
    const activeRules = sections.reduce((sum, s) => sum + s.rules.filter((r) => r.active).length, 0);
    const processedRules = sections.reduce((sum, s) => sum + s.rules.filter((r) => r.processed).length, 0);


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

    const renderSectionCard = (sec: RuleSection) => {
        const isEditing = editingSection === sec.key;
        return (
            <div key={sec.key} className={`gr-card ${sec.key === "learned" ? "gr-card-learned" : ""}`}>
                <div className="gr-card-header">
                    <div className="gr-card-title">
                        <span className="gr-card-icon">{SECTION_ICONS[sec.key] || <FaShieldAlt />}</span>
                        {sec.title}
                        <span className="gr-card-count">{sec.rules.length}</span>
                    </div>
                    <div className="gr-card-actions">
                        {isEditing ? (
                            <>
                                <button className="gr-btn gr-btn-save" onClick={saveSection} disabled={saving}>
                                    <FaSave /> {saving ? "..." : "Guardar"}
                                </button>
                                <button className="gr-btn gr-btn-cancel" onClick={cancelEditing}><FaTimes /></button>
                            </>
                        ) : (
                            (() => {
                                const hasUnprocessed = sec.rules.some((r) => r.active && !r.processed);
                                return (
                                    <>
                                        {hasUnprocessed && (
                                            <button className="gr-btn gr-btn-process" onClick={() => processSection(sec.key)} title="Procesar reglas pendientes">
                                                <FaCog /> Procesar
                                            </button>
                                        )}
                                        <button className="gr-btn gr-btn-edit" onClick={() => startEditing(sec)} title="Editar"><FaPen /></button>
                                        <button className="gr-btn gr-btn-add" onClick={() => { setAddingTo(sec.key); setNewRuleText(""); }} title="Agregar"><FaPlus /></button>
                                    </>
                                );
                            })()
                        )}
                    </div>
                </div>

                {/* Edit mode */}
                {isEditing && renderEditMode(sec.key)}

                {/* View mode */}
                {!isEditing && (
                    <div className="gr-rule-list">
                        {sec.rules.map((r, idx) => (
                            <div key={idx} className={`gr-rule ${!r.active ? "gr-inactive" : ""} ${r.source === "dictionary" ? "gr-rule-dict" : ""}`}>
                                <span className={`gr-priority-dot priority-${r.priority}`} title={PRIORITY_LABELS[r.priority]} />
                                <span className="gr-rule-text">{r.text}</span>
                                {r.source === "dictionary" && <span className="gr-dict-badge">Diccionario</span>}
                                {!r.processed && r.active && <span className="gr-pending-badge">Pendiente</span>}
                                {!r.active && <span className="gr-disabled-badge">Inactiva</span>}
                            </div>
                        ))}
                        {sec.rules.length === 0 && <div className="gr-empty">Sin reglas.</div>}
                    </div>
                )}

                {/* Quick add */}
                {addingTo === sec.key && renderQuickAdd(sec.key)}

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
                    <div className="gr-stat">
                        <span className="gr-stat-num gr-stat-orange">{activeRules - processedRules > 0 ? activeRules - processedRules : 0}</span>
                        <span className="gr-stat-label">Pendientes</span>
                    </div>
                    <div className="gr-stat">
                        <span className="gr-stat-num gr-stat-blue">{learnedSection?.rules.length || 0}</span>
                        <span className="gr-stat-label">Aprendidas</span>
                    </div>
                </div>
            </div>

            {error && <div className="gr-error">{error}</div>}

            {loading ? (
                <div className="gr-loading">Cargando reglas...</div>
            ) : (
                <>
                    {/* ── Two-column layout ── */}
                    <div className="gr-columns">

                        {/* LEFT: All rules */}
                        <div className="gr-col-left">
                            <div className="gr-group-title">
                                <FaShieldAlt /> Todas las reglas ({totalRules})
                            </div>
                            <div className="gr-filters">
                                <div className="gr-filter">
                                    <FaFilter className="gr-filter-icon" />
                                    <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
                                        <option value="all">Todas las secciones</option>
                                        {sections.map((s) => (
                                            <option key={s.key} value={s.key}>{s.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="gr-filter">
                                    <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                                        <option value="all">Todas las prioridades</option>
                                        <option value="critica">🔴 Crítica</option>
                                        <option value="alta">🟡 Alta</option>
                                        <option value="normal">🟢 Normal</option>
                                    </select>
                                </div>
                            </div>
                            <div className="gr-all-rules">
                                {(() => {
                                    const PRIO_ORDER: Record<string, number> = { critica: 0, alta: 1, normal: 2 };
                                    const filtered = sections
                                        .filter((s) => filterSection === "all" || s.key === filterSection)
                                        .flatMap((s) =>
                                            s.rules
                                                .filter((r) => r.processed && (filterPriority === "all" || r.priority === filterPriority))
                                                .map((r) => ({ ...r, sectionTitle: s.title, sectionKey: s.key }))
                                        )
                                        .sort((a, b) => (PRIO_ORDER[a.priority] ?? 9) - (PRIO_ORDER[b.priority] ?? 9));

                                    return filtered.length > 0 ? filtered.map((r, i) => (
                                        <div key={i} className={`gr-all-rule ${!r.active ? "gr-inactive" : ""}`}>
                                            <span className={`gr-priority-dot priority-${r.priority}`} />
                                            <span className="gr-all-rule-section">{r.sectionTitle}</span>
                                            <span className="gr-all-rule-text">{r.text}</span>
                                            {r.source === "dictionary" && <span className="gr-dict-badge">Diccionario</span>}
                                        </div>
                                    )) : <div className="gr-empty">Sin reglas procesadas con ese filtro.</div>;
                                })()}
                            </div>
                        </div>

                        {/* RIGHT: Section cards */}
                        <div className="gr-col-right">
                            <div className="gr-group-title">
                                <FaCheckCircle /> Reglas por sección
                            </div>
                            {appliedSections.map((sec) => renderSectionCard(sec))}
                        </div>
                    </div>

                    {/* ── Bottom: Learned rules (full width) ── */}
                    {learnedSection && (
                        <div className="gr-section-learned">
                            <div className="gr-group-title gr-group-learned">
                                <FaGraduationCap /> Reglas aprendidas / anexadas
                            </div>
                            {renderSectionCard(learnedSection)}
                        </div>
                    )}
                </>
            )}

            {toast && <div className="gr-toast">{toast}</div>}
        </div>
    );
}
