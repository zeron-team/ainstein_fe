// src/pages/Admin/TenantManager.tsx
import { useEffect, useState, useCallback } from "react";
import api from "@/api/axios";
import {
    FaBuilding,
    FaPlus,
    FaKey,
    FaTrash,
    FaEdit,
    FaCheck,
    FaTimes,
    FaCopy,
    FaSync,
    FaExclamationTriangle,
    FaInfoCircle,
    FaEye,
} from "react-icons/fa";
import "./TenantManager.css";

// =============================================================================
// TYPES
// =============================================================================

type IntegrationType = "inbound" | "outbound" | "bidirectional";

const AVAILABLE_SCOPES = [
    { id: "read_patients", label: "Leer Pacientes" },
    { id: "write_patients", label: "Escribir Pacientes" },
    { id: "read_admissions", label: "Leer Admisiones" },
    { id: "write_admissions", label: "Escribir Admisiones" },
    { id: "read_epc", label: "Leer EPCs" },
    { id: "generate_epc", label: "Generar EPCs" },
    { id: "webhook", label: "Recibir Webhooks" },
];

interface Tenant {
    id: string;
    code: string;
    name: string;
    contact_email: string | null;
    logo_url: string | null;
    is_active: boolean;
    created_at: string | null;
    api_key_count: number;
    // Integration
    integration_type: IntegrationType;
    external_endpoint: string | null;
    external_auth_type: string | null;
    has_external_token: boolean;
    allowed_scopes: string | null;
    allowed_scopes_list: string[];
    webhook_url: string | null;
    has_webhook_secret: boolean;
    api_rate_limit: number;
    notes: string | null;
}

interface APIKey {
    id: string;
    tenant_id: string;
    key_prefix: string;
    name: string | null;
    is_active: boolean;
    created_at: string | null;
    last_used_at: string | null;
    expires_at: string | null;
    full_key?: string;
}

interface NewTenantForm {
    code: string;
    name: string;
    contact_email: string;
    integration_type: IntegrationType;
    // Inbound
    external_endpoint: string;
    external_token: string;
    external_auth_type: string;
    // Outbound
    allowed_scopes: string[];
    // General
    webhook_url: string;
    webhook_secret: string;
    api_rate_limit: number;
    notes: string;
}

const DEFAULT_NEW_TENANT: NewTenantForm = {
    code: "",
    name: "",
    contact_email: "",
    integration_type: "inbound",
    external_endpoint: "",
    external_token: "",
    external_auth_type: "bearer",
    allowed_scopes: ["read_patients", "read_epc"],
    webhook_url: "",
    webhook_secret: "",
    api_rate_limit: 100,
    notes: "",
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function TenantManager() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showKeysModal, setShowKeysModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
    const [newKeyName, setNewKeyName] = useState("");
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [showInfo, setShowInfo] = useState(false);

    // Form state for new tenant
    const [newTenant, setNewTenant] = useState<NewTenantForm>({ ...DEFAULT_NEW_TENANT });

    // Fetch tenants
    const fetchTenants = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/tenants?include_inactive=true");
            setTenants(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Error al cargar tenants");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTenants();
    }, [fetchTenants]);

    // Create tenant
    const handleCreateTenant = async () => {
        try {
            const payload = {
                ...newTenant,
                allowed_scopes: newTenant.allowed_scopes.join(","),
            };
            await api.post("/admin/tenants", payload);
            setShowCreateModal(false);
            setNewTenant({ ...DEFAULT_NEW_TENANT });
            fetchTenants();
        } catch (err: any) {
            alert(err.response?.data?.detail || "Error al crear tenant");
        }
    };

    // Toggle tenant active status
    const handleToggleActive = async (tenant: Tenant) => {
        try {
            await api.patch(`/admin/tenants/${tenant.id}`, {
                is_active: !tenant.is_active,
            });
            fetchTenants();
        } catch (err: any) {
            alert(err.response?.data?.detail || "Error al actualizar tenant");
        }
    };

    // Fetch API keys for tenant
    const handleManageKeys = async (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setGeneratedKey(null);
        try {
            const res = await api.get(`/admin/tenants/${tenant.id}/api-keys`);
            setApiKeys(res.data);
            setShowKeysModal(true);
        } catch (err: any) {
            alert(err.response?.data?.detail || "Error al cargar API keys");
        }
    };

    // Generate new API key
    const handleGenerateKey = async () => {
        if (!selectedTenant || !newKeyName.trim()) return;
        try {
            const res = await api.post(`/admin/tenants/${selectedTenant.id}/api-keys`, {
                name: newKeyName,
            });
            setGeneratedKey(res.data.full_key);
            setNewKeyName("");
            // Refresh keys list
            const keysRes = await api.get(`/admin/tenants/${selectedTenant.id}/api-keys`);
            setApiKeys(keysRes.data);
            fetchTenants(); // Update key count
        } catch (err: any) {
            alert(err.response?.data?.detail || "Error al generar API key");
        }
    };

    // Revoke API key
    const handleRevokeKey = async (keyId: string) => {
        if (!selectedTenant) return;
        if (!confirm("¿Está seguro de revocar esta API key?")) return;
        try {
            await api.delete(`/admin/tenants/${selectedTenant.id}/api-keys/${keyId}`);
            const res = await api.get(`/admin/tenants/${selectedTenant.id}/api-keys`);
            setApiKeys(res.data);
            fetchTenants();
        } catch (err: any) {
            alert(err.response?.data?.detail || "Error al revocar API key");
        }
    };

    // Copy to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copiado al portapapeles");
    };

    // ==========================================================================
    // EDIT TENANT CONFIG
    // ==========================================================================

    const [showEditModal, setShowEditModal] = useState(false);
    const [editConfig, setEditConfig] = useState<any>(null);
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionResult, setConnectionResult] = useState<any>(null);

    // Load full config for editing
    const handleEditConfig = async (tenant: Tenant) => {
        try {
            const res = await api.get(`/admin/tenants/${tenant.id}/config`);
            setEditConfig(res.data);
            setSelectedTenant(tenant);
            setConnectionResult(null);
            setShowEditModal(true);
        } catch (err: any) {
            alert(err.response?.data?.detail || "Error al cargar configuración");
        }
    };

    // Save config changes
    const handleSaveConfig = async () => {
        if (!selectedTenant || !editConfig) return;
        try {
            await api.put(`/admin/tenants/${selectedTenant.id}/config`, editConfig);
            setShowEditModal(false);
            fetchTenants();
            alert("✅ Configuración guardada correctamente");
        } catch (err: any) {
            alert(err.response?.data?.detail || "Error al guardar configuración");
        }
    };

    // Test HCE connection
    const handleTestConnection = async () => {
        if (!selectedTenant) return;
        setTestingConnection(true);
        setConnectionResult(null);
        try {
            // Save current config first
            await api.put(`/admin/tenants/${selectedTenant.id}/config`, editConfig);
            // Then test
            const res = await api.post(`/admin/tenants/${selectedTenant.id}/test-connection`);
            setConnectionResult(res.data);
        } catch (err: any) {
            setConnectionResult({
                success: false,
                error: err.response?.data?.detail || "Error al probar conexión"
            });
        } finally {
            setTestingConnection(false);
        }
    };

    // ==========================================================================
    // RENDER
    // ==========================================================================

    return (
        <div className="tenant-manager">
            <header className="tenant-header">
                <div className="header-title">
                    <FaBuilding className="header-icon" />
                    <h1>Gestión de Tenants</h1>
                </div>
                <div className="header-actions">
                    <button className="btn btn-refresh" onClick={fetchTenants} disabled={loading}>
                        <FaSync className={loading ? "spinning" : ""} />
                        Actualizar
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <FaPlus />
                        Nuevo Tenant
                    </button>
                </div>
            </header>

            {error && (
                <div className="error-banner">
                    <FaExclamationTriangle />
                    {error}
                </div>
            )}

            <div className="tenant-grid">
                {loading && tenants.length === 0 ? (
                    <div className="loading-placeholder">Cargando tenants...</div>
                ) : tenants.length === 0 ? (
                    <div className="empty-state">
                        <FaBuilding className="empty-icon" />
                        <p>No hay tenants registrados</p>
                    </div>
                ) : (
                    tenants.map((tenant) => (
                        <div
                            key={tenant.id}
                            className={`tenant-card ${!tenant.is_active ? "inactive" : ""}`}
                        >
                            <div className="tenant-card-header">
                                <div className="tenant-info">
                                    <h3>
                                        {tenant.name}
                                        <span className={`integration-badge ${tenant.integration_type}`}>
                                            {tenant.integration_type === "inbound" && "⬇️ Entrante"}
                                            {tenant.integration_type === "outbound" && "⬆️ Saliente"}
                                            {tenant.integration_type === "bidirectional" && "↔️ Bidireccional"}
                                        </span>
                                    </h3>
                                    <span className="tenant-code">{tenant.code}</span>
                                </div>
                                <span className={`status-badge ${tenant.is_active ? "active" : "inactive"}`}>
                                    {tenant.is_active ? "Activo" : "Inactivo"}
                                </span>
                            </div>

                            <div className="tenant-details">
                                <div className="detail-row">
                                    <span className="detail-label">Tipo:</span>
                                    <span className="detail-value">
                                        {tenant.integration_type === "inbound" && "Ellos → Nosotros"}
                                        {tenant.integration_type === "outbound" && "Nosotros → Ellos"}
                                        {tenant.integration_type === "bidirectional" && "Ambas direcciones"}
                                    </span>
                                </div>
                                {tenant.external_endpoint && (
                                    <div className="detail-row">
                                        <span className="detail-label">Endpoint:</span>
                                        <span className="detail-value" title={tenant.external_endpoint}>
                                            {tenant.external_endpoint.length > 30
                                                ? tenant.external_endpoint.slice(0, 30) + "..."
                                                : tenant.external_endpoint}
                                        </span>
                                    </div>
                                )}
                                <div className="detail-row">
                                    <span className="detail-label">Rate Limit:</span>
                                    <span className="detail-value">{tenant.api_rate_limit} req/min</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">API Keys:</span>
                                    <span className="detail-value key-count">{tenant.api_key_count}</span>
                                </div>
                            </div>

                            <div className="tenant-actions">
                                <button
                                    className="btn btn-info btn-sm"
                                    onClick={() => {
                                        setSelectedTenant(tenant);
                                        setShowDetailModal(true);
                                    }}
                                    title="Ver configuración"
                                >
                                    <FaEye />
                                </button>
                                <button
                                    className="btn btn-warning btn-sm"
                                    onClick={() => handleEditConfig(tenant)}
                                    title="Editar configuración"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleManageKeys(tenant)}
                                >
                                    <FaKey />
                                    API Keys
                                </button>
                                <button
                                    className={`btn btn-sm ${tenant.is_active ? "btn-danger" : "btn-success"}`}
                                    onClick={() => handleToggleActive(tenant)}
                                >
                                    {tenant.is_active ? <FaTimes /> : <FaCheck />}
                                    {tenant.is_active ? "Desactivar" : "Activar"}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* CREATE TENANT MODAL */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-row">
                            <h2>Nuevo Tenant</h2>
                            <button
                                className="btn-info-toggle"
                                onClick={() => setShowInfo(!showInfo)}
                                title="Ver instrucciones"
                            >
                                <FaInfoCircle />
                            </button>
                        </div>

                        {showInfo && (
                            <div className="info-panel">
                                <h4><FaInfoCircle /> ¿Qué es un Tenant?</h4>
                                <p>
                                    Un <strong>Tenant</strong> representa una institución (hospital, clínica, sanatorio)
                                    que se integra con AInstein EPC. El tipo de integración determina quién consume qué:
                                </p>
                                <ul>
                                    <li><strong>Entrante (Inbound):</strong> Nosotros consumimos de ellos (ej: HCE de Markey). Necesitamos su endpoint y token.</li>
                                    <li><strong>Saliente (Outbound):</strong> Ellos consumen de nosotros. Les generamos API Keys y definimos permisos.</li>
                                    <li><strong>Bidireccional:</strong> Ambas direcciones. Se configuran ambos campos.</li>
                                </ul>
                            </div>
                        )}

                        {/* BASIC INFO */}
                        <div className="form-section">
                            <h4>Información Básica</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Código (slug único)</label>
                                    <input
                                        type="text"
                                        placeholder="hospital_xyz"
                                        value={newTenant.code}
                                        onChange={(e) => setNewTenant({ ...newTenant, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nombre</label>
                                    <input
                                        type="text"
                                        placeholder="Hospital XYZ"
                                        value={newTenant.name}
                                        onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Email de Contacto</label>
                                <input
                                    type="email"
                                    placeholder="admin@hospital.com"
                                    value={newTenant.contact_email}
                                    onChange={(e) => setNewTenant({ ...newTenant, contact_email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* INTEGRATION TYPE */}
                        <div className="form-section">
                            <h4>Tipo de Integración</h4>
                            <div className="integration-type-selector">
                                <label className={`type-option ${newTenant.integration_type === "inbound" ? "selected" : ""}`}>
                                    <input
                                        type="radio"
                                        name="integration_type"
                                        value="inbound"
                                        checked={newTenant.integration_type === "inbound"}
                                        onChange={() => setNewTenant({ ...newTenant, integration_type: "inbound" })}
                                    />
                                    <span className="type-label">⬇️ Entrante</span>
                                    <span className="type-desc">Ellos nos dan endpoint + token</span>
                                </label>
                                <label className={`type-option ${newTenant.integration_type === "outbound" ? "selected" : ""}`}>
                                    <input
                                        type="radio"
                                        name="integration_type"
                                        value="outbound"
                                        checked={newTenant.integration_type === "outbound"}
                                        onChange={() => setNewTenant({ ...newTenant, integration_type: "outbound" })}
                                    />
                                    <span className="type-label">⬆️ Saliente</span>
                                    <span className="type-desc">Nosotros proporcionamos API Keys</span>
                                </label>
                                <label className={`type-option ${newTenant.integration_type === "bidirectional" ? "selected" : ""}`}>
                                    <input
                                        type="radio"
                                        name="integration_type"
                                        value="bidirectional"
                                        checked={newTenant.integration_type === "bidirectional"}
                                        onChange={() => setNewTenant({ ...newTenant, integration_type: "bidirectional" })}
                                    />
                                    <span className="type-label">↔️ Bidireccional</span>
                                    <span className="type-desc">Ambas direcciones</span>
                                </label>
                            </div>
                        </div>

                        {/* INBOUND SETTINGS */}
                        {(newTenant.integration_type === "inbound" || newTenant.integration_type === "bidirectional") && (
                            <div className="form-section inbound-section">
                                <h4>⬇️ Configuración Entrante (ellos → nosotros)</h4>
                                <div className="form-group">
                                    <label>Endpoint Externo (su URL de API)</label>
                                    <input
                                        type="url"
                                        placeholder="https://api.hospital.com/hce"
                                        value={newTenant.external_endpoint}
                                        onChange={(e) => setNewTenant({ ...newTenant, external_endpoint: e.target.value })}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Token / API Key de Ellos</label>
                                        <input
                                            type="password"
                                            placeholder="Bearer token o API key"
                                            value={newTenant.external_token}
                                            onChange={(e) => setNewTenant({ ...newTenant, external_token: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Tipo de Auth</label>
                                        <select
                                            value={newTenant.external_auth_type}
                                            onChange={(e) => setNewTenant({ ...newTenant, external_auth_type: e.target.value })}
                                        >
                                            <option value="bearer">Bearer Token</option>
                                            <option value="api_key">API Key (Header)</option>
                                            <option value="basic">Basic Auth</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* OUTBOUND SETTINGS */}
                        {(newTenant.integration_type === "outbound" || newTenant.integration_type === "bidirectional") && (
                            <div className="form-section outbound-section">
                                <h4>⬆️ Configuración Saliente (nosotros → ellos)</h4>
                                <p className="hint">Después de crear el tenant, podrás generar API Keys para ellos.</p>
                                <div className="form-group">
                                    <label>Permisos Permitidos</label>
                                    <div className="scopes-grid">
                                        {AVAILABLE_SCOPES.map((scope) => (
                                            <label key={scope.id} className="scope-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={newTenant.allowed_scopes.includes(scope.id)}
                                                    onChange={(e) => {
                                                        const newScopes = e.target.checked
                                                            ? [...newTenant.allowed_scopes, scope.id]
                                                            : newTenant.allowed_scopes.filter(s => s !== scope.id);
                                                        setNewTenant({ ...newTenant, allowed_scopes: newScopes });
                                                    }}
                                                />
                                                {scope.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Webhook URL (notificaciones)</label>
                                    <input
                                        type="url"
                                        placeholder="https://hospital.com/webhook/ainstein"
                                        value={newTenant.webhook_url}
                                        onChange={(e) => setNewTenant({ ...newTenant, webhook_url: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* GENERAL */}
                        <div className="form-section">
                            <h4>Configuración General</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Rate Limit (req/min)</label>
                                    <input
                                        type="number"
                                        value={newTenant.api_rate_limit}
                                        onChange={(e) => setNewTenant({ ...newTenant, api_rate_limit: parseInt(e.target.value) || 100 })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Notas Internas</label>
                                <textarea
                                    placeholder="Notas para referencia interna..."
                                    value={newTenant.notes}
                                    onChange={(e) => setNewTenant({ ...newTenant, notes: e.target.value })}
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreateTenant}
                                disabled={!newTenant.code || !newTenant.name}
                            >
                                Crear Tenant
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* API KEYS MODAL */}
            {showKeysModal && selectedTenant && (
                <div className="modal-overlay" onClick={() => setShowKeysModal(false)}>
                    <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
                        <h2>
                            <FaKey /> API Keys - {selectedTenant.name}
                        </h2>

                        {/* Generated Key Alert */}
                        {generatedKey && (
                            <div className="key-alert">
                                <FaExclamationTriangle />
                                <div>
                                    <strong>¡Guarde esta clave ahora!</strong>
                                    <p>Solo se muestra una vez:</p>
                                    <code className="key-display">{generatedKey}</code>
                                    <button className="btn btn-sm btn-copy" onClick={() => copyToClipboard(generatedKey)}>
                                        <FaCopy /> Copiar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* New Key Form */}
                        <div className="new-key-form">
                            <input
                                type="text"
                                placeholder="Nombre de la clave (ej: Production)"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={handleGenerateKey}
                                disabled={!newKeyName.trim()}
                            >
                                <FaPlus /> Generar Nueva Clave
                            </button>
                        </div>

                        {/* Keys List */}
                        <div className="keys-list">
                            {apiKeys.length === 0 ? (
                                <p className="no-keys">No hay API keys para este tenant</p>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Prefijo</th>
                                            <th>Nombre</th>
                                            <th>Estado</th>
                                            <th>Último Uso</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {apiKeys.map((key) => (
                                            <tr key={key.id} className={!key.is_active ? "revoked" : ""}>
                                                <td><code>{key.key_prefix}...</code></td>
                                                <td>{key.name || "-"}</td>
                                                <td>
                                                    <span className={`key-status ${key.is_active ? "active" : "revoked"}`}>
                                                        {key.is_active ? "Activa" : "Revocada"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {key.last_used_at
                                                        ? new Date(key.last_used_at).toLocaleDateString()
                                                        : "Nunca"}
                                                </td>
                                                <td>
                                                    {key.is_active && (
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleRevokeKey(key.id)}
                                                        >
                                                            <FaTrash /> Revocar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowKeysModal(false)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL VIEW MODAL */}
            {showDetailModal && selectedTenant && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-row">
                            <h2>
                                <FaEye /> {selectedTenant.name}
                                <span className={`integration-badge ${selectedTenant.integration_type}`}>
                                    {selectedTenant.integration_type === "inbound" && "⬇️ Entrante"}
                                    {selectedTenant.integration_type === "outbound" && "⬆️ Saliente"}
                                    {selectedTenant.integration_type === "bidirectional" && "↔️ Bidireccional"}
                                </span>
                            </h2>
                        </div>

                        {/* Basic Info */}
                        <div className="detail-section">
                            <h4>📋 Información General</h4>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Código:</span>
                                    <span className="detail-value"><code>{selectedTenant.code}</code></span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Email:</span>
                                    <span className="detail-value">{selectedTenant.contact_email || "-"}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Estado:</span>
                                    <span className={`status-badge ${selectedTenant.is_active ? "active" : "inactive"}`}>
                                        {selectedTenant.is_active ? "Activo" : "Inactivo"}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Rate Limit:</span>
                                    <span className="detail-value">{selectedTenant.api_rate_limit} req/min</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">API Keys:</span>
                                    <span className="detail-value key-count">{selectedTenant.api_key_count}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Creado:</span>
                                    <span className="detail-value">
                                        {selectedTenant.created_at
                                            ? new Date(selectedTenant.created_at).toLocaleDateString()
                                            : "-"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Inbound Config */}
                        {(selectedTenant.integration_type === "inbound" || selectedTenant.integration_type === "bidirectional") && (
                            <div className="detail-section inbound-section">
                                <h4>⬇️ Configuración Entrante (ellos → nosotros)</h4>
                                <div className="detail-grid">
                                    <div className="detail-item full-width">
                                        <span className="detail-label">Endpoint Externo:</span>
                                        <span className="detail-value">
                                            {selectedTenant.external_endpoint || <em>No configurado</em>}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Tipo de Auth:</span>
                                        <span className="detail-value">{selectedTenant.external_auth_type || "-"}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Token Configurado:</span>
                                        <span className="detail-value">
                                            {selectedTenant.has_external_token ? "✅ Sí" : "❌ No"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Outbound Config */}
                        {(selectedTenant.integration_type === "outbound" || selectedTenant.integration_type === "bidirectional") && (
                            <div className="detail-section outbound-section">
                                <h4>⬆️ Configuración Saliente (nosotros → ellos)</h4>
                                <div className="detail-grid">
                                    <div className="detail-item full-width">
                                        <span className="detail-label">Permisos:</span>
                                        <div className="scopes-display">
                                            {selectedTenant.allowed_scopes_list && selectedTenant.allowed_scopes_list.length > 0 ? (
                                                selectedTenant.allowed_scopes_list.map((scope) => (
                                                    <span key={scope} className="scope-tag">
                                                        {AVAILABLE_SCOPES.find(s => s.id === scope)?.label || scope}
                                                    </span>
                                                ))
                                            ) : (
                                                <em>Sin permisos configurados</em>
                                            )}
                                        </div>
                                    </div>
                                    <div className="detail-item full-width">
                                        <span className="detail-label">Webhook URL:</span>
                                        <span className="detail-value">
                                            {selectedTenant.webhook_url || <em>No configurado</em>}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Webhook Secret:</span>
                                        <span className="detail-value">
                                            {selectedTenant.has_webhook_secret ? "✅ Configurado" : "❌ No"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {selectedTenant.notes && (
                            <div className="detail-section">
                                <h4>📝 Notas</h4>
                                <p className="notes-text">{selectedTenant.notes}</p>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                                Cerrar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleManageKeys(selectedTenant);
                                }}
                            >
                                <FaKey /> Gestionar API Keys
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT CONFIG MODAL */}
            {showEditModal && editConfig && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-row">
                            <h2>
                                <FaEdit /> Editar: {editConfig.name}
                            </h2>
                        </div>

                        {/* Basic Info */}
                        <div className="form-section">
                            <h4>📋 Información Básica</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nombre</label>
                                    <input
                                        type="text"
                                        value={editConfig.name || ""}
                                        onChange={(e) => setEditConfig({ ...editConfig, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email Contacto</label>
                                    <input
                                        type="email"
                                        value={editConfig.contact_email || ""}
                                        onChange={(e) => setEditConfig({ ...editConfig, contact_email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Tipo de Integración</label>
                                <select
                                    value={editConfig.integration_type || "inbound"}
                                    onChange={(e) => setEditConfig({ ...editConfig, integration_type: e.target.value })}
                                >
                                    <option value="inbound">⬇️ Entrante (ellos → nosotros)</option>
                                    <option value="outbound">⬆️ Saliente (nosotros → ellos)</option>
                                    <option value="bidirectional">↔️ Bidireccional</option>
                                </select>
                            </div>
                        </div>

                        {/* Inbound Config - HCE */}
                        {(editConfig.integration_type === "inbound" || editConfig.integration_type === "bidirectional") && (
                            <div className="form-section inbound-section">
                                <h4>⬇️ Configuración HCE Entrante</h4>

                                <div className="form-group">
                                    <label>Endpoint API (URL del HCE)</label>
                                    <input
                                        type="url"
                                        placeholder="https://api.hospital.com/hce"
                                        value={editConfig.external_endpoint || ""}
                                        onChange={(e) => setEditConfig({ ...editConfig, external_endpoint: e.target.value })}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Token de Autenticación</label>
                                        <input
                                            type="password"
                                            placeholder="Token o Bearer token"
                                            value={editConfig.external_token || ""}
                                            onChange={(e) => setEditConfig({ ...editConfig, external_token: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Tipo Auth</label>
                                        <select
                                            value={editConfig.external_auth_type || "bearer"}
                                            onChange={(e) => setEditConfig({ ...editConfig, external_auth_type: e.target.value })}
                                        >
                                            <option value="bearer">Bearer Token</option>
                                            <option value="api_key">API Key</option>
                                            <option value="basic">Basic Auth</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nombre Aplicación (HCE)</label>
                                        <input
                                            type="text"
                                            placeholder="AInstein"
                                            value={editConfig.hce_app || ""}
                                            onChange={(e) => setEditConfig({ ...editConfig, hce_app: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>API Key del HCE</label>
                                        <input
                                            type="password"
                                            placeholder="API Key para el HCE"
                                            value={editConfig.hce_api_key || ""}
                                            onChange={(e) => setEditConfig({ ...editConfig, hce_api_key: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Método HTTP</label>
                                        <select
                                            value={editConfig.hce_http_method || "GET"}
                                            onChange={(e) => setEditConfig({ ...editConfig, hce_http_method: e.target.value })}
                                        >
                                            <option value="GET">GET</option>
                                            <option value="POST">POST</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Timeout (segundos)</label>
                                        <input
                                            type="number"
                                            value={editConfig.hce_timeout_seconds || 60}
                                            onChange={(e) => setEditConfig({ ...editConfig, hce_timeout_seconds: parseInt(e.target.value) || 60 })}
                                        />
                                    </div>
                                </div>

                                {/* Test Connection Button */}
                                <div className="test-connection-section">
                                    <button
                                        className={`btn ${connectionResult?.success ? "btn-success" : "btn-warning"}`}
                                        onClick={handleTestConnection}
                                        disabled={testingConnection}
                                    >
                                        {testingConnection ? "Probando..." : "🔌 Probar Conexión"}
                                    </button>

                                    {connectionResult && (
                                        <div className={`connection-result ${connectionResult.success ? "success" : "error"}`}>
                                            {connectionResult.success ? (
                                                <>
                                                    <strong>✅ Conexión exitosa</strong>
                                                    <p>HTTP {connectionResult.http_status}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <strong>❌ Error de conexión</strong>
                                                    <p>{connectionResult.error}</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Outbound Config */}
                        {(editConfig.integration_type === "outbound" || editConfig.integration_type === "bidirectional") && (
                            <div className="form-section outbound-section">
                                <h4>⬆️ Configuración Saliente</h4>

                                <div className="form-group">
                                    <label>Permisos (separados por coma)</label>
                                    <input
                                        type="text"
                                        placeholder="read_patients,read_epc"
                                        value={editConfig.allowed_scopes || ""}
                                        onChange={(e) => setEditConfig({ ...editConfig, allowed_scopes: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Webhook URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://hospital.com/webhook"
                                        value={editConfig.webhook_url || ""}
                                        onChange={(e) => setEditConfig({ ...editConfig, webhook_url: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Webhook Secret</label>
                                    <input
                                        type="password"
                                        placeholder="Secret para validar webhooks"
                                        value={editConfig.webhook_secret || ""}
                                        onChange={(e) => setEditConfig({ ...editConfig, webhook_secret: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* DISPLAY RULES - Configure which HCE sections to show/hide */}
                        <div className="form-section">
                            <h4>👁️ Reglas de Visualización</h4>
                            <p className="hint">
                                Seleccione las secciones de HCE que desea <strong>ocultar</strong> para este tenant.
                                <br /><small style={{ color: "#888" }}>Basado en análisis de 120 HCE (98.445 registros, 61.873 procedimientos)</small>
                            </p>

                            {/* TIPOS DE REGISTRO */}
                            <h5 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#666" }}>📋 Tipos de Registro</h5>
                            <div className="scopes-grid">
                                {[
                                    { id: "indicacion", name: "Indicaciones", desc: "Indicaciones médicas (62.013)" },
                                    { id: "hoja_enfermeria", name: "Hoja de Enfermería", desc: "Hojas enfermería (16.128)" },
                                    { id: "balance_hidroelectrolitico", name: "Balance Hidroelectrolítico", desc: "Balance fluidos (13.662)" },
                                    { id: "evolucion_medica", name: "Evolución Médica", desc: "Evolución a cargo (2.103)" },
                                    { id: "control_enfermeria", name: "Control de Enfermería", desc: "Controles enfermería (1.360)" },
                                    { id: "evolucion_interconsulta", name: "Evolución Interconsulta", desc: "Interconsultas (1.358)" },
                                    { id: "evolucion_kinesiologia", name: "Evolución Kinesiología", desc: "Kinesiología UCI/Int (746)" },
                                    { id: "evolucion_hemoterapia", name: "Evolución Hemoterapia", desc: "Hemoterapia (170)" },
                                    { id: "resumen_internacion", name: "Resumen Internación", desc: "Resúmenes (128)" },
                                    { id: "epicrisis", name: "Epicrisis HIS", desc: "Epicrisis origen (125)" },
                                    { id: "ingreso_paciente", name: "Ingreso de Paciente", desc: "Registros ingreso (106)" },
                                    { id: "parte_quirurgico", name: "Parte Quirúrgico", desc: "Partes quirúrgicos (83)" },
                                    { id: "checklist_quirofano", name: "Checklist Quirófano", desc: "Entrada/pausa/salida (195)" },
                                    { id: "monitoreo_quirurgico", name: "Monitoreo Quirúrgico", desc: "Durante cirugía (62)" },
                                    { id: "evolucion_emergencia", name: "Evolución Emergencia", desc: "Emergencias (40)" },
                                    { id: "evolucion_fonoaudiologia", name: "Evolución Fonoaudiología", desc: "Fonoaudiología (37)" },
                                    { id: "protocolo_dialisis", name: "Protocolo de Diálisis", desc: "Diálisis (9)" },
                                ].map((section) => {
                                    const excludedSections = editConfig.excluded_sections || [];
                                    const isExcluded = excludedSections.includes(section.id);
                                    return (
                                        <label key={section.id} className="scope-checkbox" title={section.desc}>
                                            <input
                                                type="checkbox"
                                                checked={isExcluded}
                                                onChange={(e) => {
                                                    const newExcluded = e.target.checked
                                                        ? [...excludedSections, section.id]
                                                        : excludedSections.filter((s: string) => s !== section.id);
                                                    setEditConfig({ ...editConfig, excluded_sections: newExcluded });
                                                }}
                                            />
                                            <span>🚫 {section.name}</span>
                                        </label>
                                    );
                                })}
                            </div>

                            {/* CATEGORÍAS DE PROCEDIMIENTOS */}
                            <h5 style={{ marginTop: "1.5rem", marginBottom: "0.5rem", color: "#666" }}>💊 Categorías de Procedimientos</h5>
                            <div className="scopes-grid">
                                {[
                                    { id: "control", name: "Controles Rutinarios", desc: "Signos vitales, glucemia (16.449)" },
                                    { id: "enfermeria", name: "Proc. Enfermería", desc: "Cambios posición, decúbito (14.164)" },
                                    { id: "otro", name: "Otros", desc: "Tendido cama, cambio hab. (11.444)" },
                                    { id: "laboratorio", name: "Laboratorio", desc: "Hemograma, PCR (4.647)" },
                                    { id: "higiene", name: "Higiene y Confort", desc: "Baño, cambio pañal (4.355)" },
                                    { id: "valoracion", name: "Valoraciones", desc: "Tolerancia oral, fluido (3.671)" },
                                    { id: "medicacion_admin", name: "Admin. Medicación", desc: "VO, SNG, tópica (3.250)" },
                                    { id: "imagen", name: "Imágenes", desc: "RX, TAC (965)" },
                                    { id: "tratamiento", name: "Tratamientos", desc: "Curaciones, transfusiones (855)" },
                                    { id: "valoracion_clinica", name: "Escalas Clínicas", desc: "Morse, RASS, Glasgow (836)" },
                                    { id: "interconsulta", name: "Interconsultas", desc: "Cardiología, psiquiatría (624)" },
                                    { id: "quirurgico", name: "Proc. Quirúrgicos", desc: "Drenajes, paracentesis (394)" },
                                    { id: "estudio", name: "Estudios Diagnósticos", desc: "Biopsias, holter (219)" },
                                ].map((section) => {
                                    const excludedSections = editConfig.excluded_sections || [];
                                    const isExcluded = excludedSections.includes(section.id);
                                    return (
                                        <label key={section.id} className="scope-checkbox" title={section.desc}>
                                            <input
                                                type="checkbox"
                                                checked={isExcluded}
                                                onChange={(e) => {
                                                    const newExcluded = e.target.checked
                                                        ? [...excludedSections, section.id]
                                                        : excludedSections.filter((s: string) => s !== section.id);
                                                    setEditConfig({ ...editConfig, excluded_sections: newExcluded });
                                                }}
                                            />
                                            <span>🚫 {section.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* General */}
                        <div className="form-section">
                            <h4>⚙️ Configuración General</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Rate Limit (req/min)</label>
                                    <input
                                        type="number"
                                        value={editConfig.api_rate_limit || 100}
                                        onChange={(e) => setEditConfig({ ...editConfig, api_rate_limit: parseInt(e.target.value) || 100 })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Notas</label>
                                <textarea
                                    rows={3}
                                    value={editConfig.notes || ""}
                                    onChange={(e) => setEditConfig({ ...editConfig, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                                Cancelar
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveConfig}>
                                💾 Guardar Configuración
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
