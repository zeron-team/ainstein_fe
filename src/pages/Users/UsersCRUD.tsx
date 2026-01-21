// frontend/src/pages/Users/UsersCRUD.tsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/axios";
import {
  FaUserPlus,
  FaSave,
  FaSync,
  FaSearch,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaUser,
  FaShieldAlt,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import "./UsersCRUD.css";

// -----------------------
// Tipos
// -----------------------
type RoleName = "admin" | "medico" | "viewer";

type User = {
  id: string;
  username: string;
  full_name: string;
  email?: string | null;
  role: RoleName | string | null;
  is_active?: boolean;
};

type NewUserForm = {
  username: string;
  full_name: string;
  email: string;
  password: string;
  role: RoleName;
};

// -----------------------
// Constantes
// -----------------------
const EMPTY_FORM: NewUserForm = {
  username: "",
  full_name: "",
  email: "",
  password: "",
  role: "medico",
};

const ROLE_OPTIONS: RoleName[] = ["admin", "medico", "viewer"];

// -----------------------
// Helpers
// -----------------------
function normalizeRole(role: User["role"]): RoleName | "" {
  if (!role) return "";
  const v = String(role).toLowerCase();
  if (v === "admin" || v === "medico" || v === "viewer") return v;
  return "";
}

function safeString(x: unknown): string {
  if (x === null || x === undefined) return "";
  if (typeof x === "string" || typeof x === "number" || typeof x === "boolean") {
    return String(x);
  }
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
}

// Convierte error Axios/FastAPI en string
function extractErrorMessage(error: any): string {
  const data = error?.response?.data;

  if (!data) {
    return safeString(error?.message || error);
  }

  const detail = (data as any).detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((d: any) => {
        const loc = Array.isArray(d?.loc) ? d.loc.slice(1).join(".") : "";
        const m = safeString(d?.msg || "Error de validación");
        return loc ? `${loc}: ${m}` : m;
      })
      .join(" | ");
  }

  if (typeof (data as any).message === "string") {
    return (data as any).message;
  }

  return safeString(data);
}

function normalizeUsersResponse(raw: any): User[] {
  const arr = raw?.items ?? raw ?? [];
  if (!Array.isArray(arr)) return [];
  return arr.map((u: any) => ({
    id: safeString(u.id),
    username: safeString(u.username),
    full_name: safeString(u.full_name),
    email: typeof u.email === "string" ? u.email : null,
    role: u.role ?? null,
    is_active: typeof u.is_active === "boolean" ? u.is_active : true,
  }));
}

// -----------------------
// Componente principal
// -----------------------
const UsersCRUD: React.FC = () => {
  const [items, setItems] = useState<User[]>([]);
  const [form, setForm] = useState<NewUserForm>({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msgOk, setMsgOk] = useState<string | null>(null);
  const [msgErr, setMsgErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // -----------------------
  // Carga inicial
  // -----------------------
  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUsers() {
    setLoading(true);
    setMsgErr(null);
    try {
      const res = await api.get("/admin/users");
      const users = normalizeUsersResponse(res.data);
      setItems(users);
    } catch (e: any) {
      console.error("[UsersCRUD] Error al cargar usuarios:", e);
      setMsgErr(extractErrorMessage(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // -----------------------
  // Helpers de formulario
  // -----------------------
  function setField<K extends keyof NewUserForm>(key: K, value: NewUserForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSave = useMemo(() => {
    const u = form.username.trim();
    const n = form.full_name.trim();
    const pw = form.password;
    if (editingId) {
      // En edición NO obligamos a cambiar contraseña
      return u.length >= 3 && n.length >= 3;
    }
    // Alta nueva: password mínimo 6
    return u.length >= 3 && n.length >= 3 && pw.length >= 6;
  }, [form, editingId]);

  const isEditing = Boolean(editingId);

  // -----------------------
  // Crear / Actualizar usuario
  // -----------------------
  async function handleSaveUser() {
    if (!canSave) {
      setMsgErr(
        isEditing
          ? "Completa usuario y nombre (no es necesario cambiar contraseña)."
          : "Completa usuario/nombre y una contraseña de al menos 6 caracteres."
      );
      return;
    }

    setSaving(true);
    setMsgOk(null);
    setMsgErr(null);

    try {
      if (!isEditing) {
        // Alta
        await api.post("/admin/users", form);
        setMsgOk("Usuario creado correctamente.");
      } else {
        // Edición
        const payload: any = {
          full_name: form.full_name,
          email: form.email || null,
          role: form.role,
        };
        // Si el usuario cargó un password nuevo, lo mandamos
        if (form.password.trim().length >= 6) {
          // Puedes agregar un endpoint específico para cambiar password si lo prefieres;
          // por ahora lo ignoramos en backend para simplificar.
          // Aquí NO lo mandamos porque UserUpdate no tiene password.
        }

        await api.put(`/admin/users/${editingId}`, payload);
        setMsgOk("Usuario actualizado correctamente.");
      }

      setForm({ ...EMPTY_FORM });
      setEditingId(null);
      setShowPw(false);
      await loadUsers();
      setTimeout(() => setMsgOk(null), 1500);
    } catch (e: any) {
      console.error("[UsersCRUD] Error al guardar usuario:", e);
      const msg = extractErrorMessage(e);
      setMsgErr(msg || "No se pudo guardar el usuario.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(u: User) {
    const roleNorm = normalizeRole(u.role) || "medico";
    setEditingId(u.id);
    setForm({
      username: u.username,
      full_name: u.full_name,
      email: u.email || "",
      password: "",
      role: roleNorm,
    });
    setShowPw(false);
    setMsgOk(null);
    setMsgErr(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowPw(false);
    setMsgOk(null);
    setMsgErr(null);
  }

  // -----------------------
  // Eliminar usuario
  // -----------------------
  async function handleDeleteUser(u: User) {
    if (!window.confirm(`¿Eliminar al usuario "${u.username}"?`)) return;

    setSaving(true);
    setMsgErr(null);
    setMsgOk(null);

    try {
      await api.delete(`/admin/users/${u.id}`);
      setMsgOk("Usuario eliminado.");
      await loadUsers();
      setTimeout(() => setMsgOk(null), 1500);
    } catch (e: any) {
      console.error("[UsersCRUD] Error al eliminar usuario:", e);
      setMsgErr(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  // -----------------------
  // Filtro local
  // -----------------------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) => {
      const roleName = normalizeRole(u.role);
      return [u.username, u.full_name, u.email ?? "", roleName]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [items, query]);

  // -----------------------
  // Render
  // -----------------------
  return (
    <div className="usr-page">
      <div className="title">Usuarios</div>
      <div className="subtitle">Alta, edición y baja de usuarios del sistema</div>

      <div className="usr-grid">
        {/* --- Alta / Edición de usuario --- */}
        <div className="card">
          <div
            className="subtitle"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <FaUserPlus /> {isEditing ? "Editar usuario" : "Nuevo usuario"}
          </div>

          <div className="usr-form">
            <div className="usr-row">
              <div className="usr-field">
                <label className="usr-label">Usuario</label>
                <div style={{ position: "relative" }}>
                  <FaUser
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 12,
                      opacity: 0.6,
                    }}
                  />
                  <input
                    className="usr-input"
                    style={{ paddingLeft: 36 }}
                    placeholder="ej: rfernandez"
                    value={form.username}
                    onChange={(e) => setField("username", e.target.value)}
                    disabled={isEditing} // no dejamos cambiar username en edición
                  />
                </div>
              </div>

              <div className="usr-field">
                <label className="usr-label">Nombre completo</label>
                <input
                  className="usr-input"
                  placeholder="Apellido, Nombre"
                  value={form.full_name}
                  onChange={(e) => setField("full_name", e.target.value)}
                />
              </div>
            </div>

            <div className="usr-row">
              <div className="usr-field">
                <label className="usr-label">Email</label>
                <div style={{ position: "relative" }}>
                  <FaEnvelope
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 12,
                      opacity: 0.6,
                    }}
                  />
                  <input
                    className="usr-input"
                    style={{ paddingLeft: 36 }}
                    placeholder="correo@hospital.org"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="usr-field">
                <label className="usr-label">Rol</label>
                <div style={{ position: "relative" }}>
                  <FaShieldAlt
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 12,
                      opacity: 0.6,
                    }}
                  />
                  <select
                    className="usr-select"
                    style={{ paddingLeft: 36 }}
                    value={form.role}
                    onChange={(e) =>
                      setField("role", e.target.value as RoleName)
                    }
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="usr-row">
              <div className="usr-field">
                <label className="usr-label">
                  {isEditing ? "Contraseña (opcional)" : "Contraseña"}
                </label>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    className="usr-input"
                    type={showPw ? "text" : "password"}
                    placeholder={
                      isEditing
                        ? "Dejar en blanco para no cambiar"
                        : "Mínimo 6 caracteres"
                    }
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ position: "absolute", right: 6 }}
                    onClick={() => setShowPw((v) => !v)}
                    title={showPw ? "Ocultar" : "Mostrar"}
                  >
                    {showPw ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="usr-field" />
            </div>

            <div className="usr-toolbar">
              <button
                className="btn primary"
                type="button"
                onClick={handleSaveUser}
                disabled={saving || !canSave}
              >
                <FaSave />{" "}
                {saving
                  ? isEditing
                    ? "Guardando…"
                    : "Creando…"
                  : isEditing
                  ? "Guardar cambios"
                  : "Crear usuario"}
              </button>
              <button
                className="btn"
                type="button"
                onClick={isEditing ? cancelEdit : () => setForm({ ...EMPTY_FORM })}
                disabled={saving}
              >
                <FaSync /> {isEditing ? "Cancelar edición" : "Limpiar"}
              </button>
            </div>

            {msgOk && <div className="toast ok">{msgOk}</div>}
            {msgErr && <div className="toast err">{msgErr}</div>}
          </div>
        </div>

        {/* --- Listado --- */}
        <div className="card">
          <div className="usr-table-toolbar">
            <div className="subtitle" style={{ margin: 0 }}>
              Listado de usuarios ({items.length})
            </div>
            <div className="usr-search">
              <FaSearch />
              <input
                placeholder="Buscar usuario, nombre, email o rol…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="subtitle">Cargando…</div>
          ) : (
            <div className="table-wrap">
              <table className="usr-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th style={{ textAlign: "center" }}>Rol</th>
                    <th style={{ textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const roleName = normalizeRole(u.role) || "viewer";
                    return (
                      <tr className="usr-row-item" key={u.id}>
                        <td>{u.username || "—"}</td>
                        <td>{u.full_name || "—"}</td>
                        <td>{u.email || "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`badge ${roleName}`}>
                            {roleName}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="btn"
                            style={{ marginRight: 6 }}
                            onClick={() => startEdit(u)}
                          >
                            <FaEdit /> Editar
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => handleDeleteUser(u)}
                          >
                            <FaTrash /> Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: 16,
                          color: "#9db1cf",
                          textAlign: "center",
                        }}
                      >
                        Sin resultados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersCRUD;