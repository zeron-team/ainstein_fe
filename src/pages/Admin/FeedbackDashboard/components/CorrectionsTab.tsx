// src/pages/Admin/FeedbackDashboard/components/CorrectionsTab.tsx
import {
    FaCheck,
    FaTimes,
    FaUserMd,
    FaSearch,
    FaExclamationTriangle,
} from "react-icons/fa";
import type { CorrectionEntry, DictionaryRule, PendingAction } from "@/types/feedback";
import { SECTION_LABELS, timeAgo } from "../constants";

type CorrectionsTabProps = {
    loadingCorrections: boolean;
    correctionsData: CorrectionEntry[];
    dictionaryRules: DictionaryRule[];
    approvingId: string | null;
    pendingAction: PendingAction;
    setPendingAction: (action: PendingAction) => void;
    requestApproval: (correctionId: string, status: "approved" | "rejected", itemText: string) => void;
    approveCorrection: (correctionId: string, status: "approved" | "rejected") => void;
    markAsConsultar: (correctionId: string) => void;
    revokeApproval: (correctionId: string) => void;
};

export default function CorrectionsTab({
    loadingCorrections,
    correctionsData,
    dictionaryRules,
    approvingId,
    pendingAction,
    setPendingAction,
    requestApproval,
    approveCorrection,
    markAsConsultar,
    revokeApproval,
}: CorrectionsTabProps) {
    return (
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
                                            <th>Quién</th>
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
                                                <td className="fb-td-who">
                                                    {c.user_name ? (
                                                        <span className="fb-corr-who" title={c.approved_by ? `Aprobado por: ${c.approved_by}` : ""}>
                                                            {c.user_name}
                                                            {c.approved_by && c.approved_by !== c.user_name && (
                                                                <span className="fb-corr-approver"> → {c.approved_by}</span>
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
                                                    )}
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
                                            <th>Creado por</th>
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
                                                    <details className="fb-dict-freq-details">
                                                        <summary className="fb-dict-freq-summary">
                                                            <span className="fb-dict-freq">{rule.frequency}×</span>
                                                        </summary>
                                                        <div className="fb-dict-freq-popup">
                                                            <div className="fb-dict-freq-creator">
                                                                👤 <strong>{rule.created_by || "sistema"}</strong>
                                                            </div>
                                                            {rule.audit_log && rule.audit_log.length > 0 && (
                                                                <ul className="fb-dict-audit-list">
                                                                    {rule.audit_log.map((entry, idx) => (
                                                                        <li key={idx}>
                                                                            {entry.action === "created" ? "🆕" : entry.action === "processed" ? "✅" : "🔄"}{" "}
                                                                            {entry.type || entry.action} por <strong>{entry.by}</strong>
                                                                            {entry.at && <span className="fb-dict-audit-date"> — {new Date(entry.at).toLocaleString("es-AR")}</span>}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </details>
                                                </td>
                                                <td>
                                                    <span className="fb-dict-creator">{rule.created_by || "sistema"}</span>
                                                    {rule.audit_log && rule.audit_log.length > 0 && (
                                                        <details className="fb-dict-audit">
                                                            <summary className="fb-dict-audit-toggle">{rule.audit_log.length} acción{rule.audit_log.length > 1 ? "es" : ""}</summary>
                                                            <ul className="fb-dict-audit-list">
                                                                {rule.audit_log.map((entry, idx) => (
                                                                    <li key={idx}>
                                                                        {entry.action === "created" ? "🆕" : "🔄"} por <strong>{entry.by}</strong>
                                                                        {entry.at && <span className="fb-dict-audit-date"> — {new Date(entry.at).toLocaleString("es-AR")}</span>}
                                                                        {entry.patient_id && <span className="fb-dict-audit-patient"> (pac. {entry.patient_id})</span>}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </details>
                                                    )}
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

            {/* Modal de confirmación de aprobación/rechazo */}
            {pendingAction && (
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
            )}
        </div>
    );
}
