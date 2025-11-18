// frontend/src/pages/Users/UsersCRUD.tsx
import { useEffect, useMemo, useState } from "react";
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
} from "react-icons/fa";

type User = {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  role: string;
};

type NewUserForm = {
  username: string;
  full_name: string;
  email: string;
  password: string;
  role_id: number; // 1=admin, 2=medico, 3=viewer (según tu backend)
};

const EMPTY_FORM: NewUserForm = {
  username: "",
  full_name: "",
  email: "",
  password: "",
  role_id: 2,
};

const ROLE_OPTIONS = [
  { id: 1, label: "admin" },
  { id: 2, label: "medico" },
  { id: 3, label: "viewer" },
] as const;

const STYLE_ID = "users-crud-styles";

export default function UsersCRUD() {
  // ------- estilos inyectados (una sola vez) -------
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement("style");
      s.id = STYLE_ID;
      s.innerHTML = `
      .usr-page { padding: 20px; color:#e6ecf7; }
      .usr-grid { display:grid; gap:16px; grid-template-columns: 1fr; }
      @media (min-width: 1100px) { .usr-grid { grid-template-columns: 1.05fr 1.6fr; } }
      .card { border:1px solid rgba(255,255,255,.08); background: rgba(8,15,30,.6); border-radius:16px; padding:18px; }
      .title { font-size: 22px; font-weight: 800; letter-spacing:.2px; margin-bottom: 6px; }
      .subtitle { font-size: 14px; color:#9db1cf; margin-bottom: 10px; }
      .usr-form { display:grid; gap:12px; }
      .usr-field { display:flex; flex-direction:column; gap:6px; }
      .usr-label { font-size:12px; color:#9db1cf; }
      .usr-input, .usr-select {
        width:100%; background: rgba(255,255,255,.06);
        border:1px solid rgba(255,255,255,.12); color:#eaf1ff;
        border-radius:10px; padding:10px 12px; font-size:14px; outline:none;
      }
      .usr-input:focus, .usr-select:focus { border-color: rgba(80,180,255,.5); box-shadow: 0 0 0 3px rgba(80,180,255,.15); }
      .usr-row { display:grid; gap:12px; grid-template-columns: 1fr; }
      @media (min-width: 720px) { .usr-row { grid-template-columns: 1fr 1fr; } }
      .usr-toolbar { display:flex; gap:10px; flex-wrap:wrap; }
      .btn {
        display:inline-flex; align-items:center; gap:8px; cursor:pointer;
        border:1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.03);
        color:#eaf3ff; padding:10px 14px; border-radius:12px; transition: all .15s ease;
      }
      .btn:hover { transform: translateY(-1px); filter:brightness(1.05); }
      .btn.primary { background: linear-gradient(135deg,#2a5fff,#3fb2ff); border-color: rgba(80,180,255,.5); }
      .btn:disabled { opacity:.6; cursor:not-allowed; transform:none !important; }

      .usr-table-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom: 10px; flex-wrap: wrap; }
      .usr-search { display:flex; align-items:center; gap:8px; padding: 8px 10px; border-radius:12px;
        background: rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); min-width: 260px; }
      .usr-search input { background: transparent; border:0; outline:0; color:#eaf1ff; width:100%; font-size:14px; }

      .table-wrap { overflow:auto; border-radius:14px; border:1px solid rgba(255,255,255,.08); }
      table.usr-table { width:100%; border-collapse: collapse; }
      .usr-table th, .usr-table td { padding:12px 14px; border-bottom:1px solid rgba(255,255,255,.08); font-size:14px; }
      .usr-table thead th { text-align:left; color:#9db1cf; background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03)); position:sticky; top:0; }
      .usr-row-item:hover { background: rgba(255,255,255,.03); }

      .badge { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:700; border:1px solid transparent; }
      .badge.admin  { background: rgba(255,140,140,.15); color:#ffd1d1; border-color: rgba(255,140,140,.35); }
      .badge.medico { background: rgba(80,180,255,.15);  color:#bfe2ff; border-color: rgba(80,180,255,.35); }
      .badge.viewer { background: rgba(170,170,170,.14); color:#e7e7e7; border-color: rgba(170,170,170,.35); }

      .toast { margin-top: 6px; font-size: 13px; }
      .toast.ok { color:#8ff0b8; }
      .toast.err { color:#ff9c9c; }
      `;
      document.head.appendChild(s);
    }
  }, []);

  // ------- estado -------
  const [items, setItems] = useState<User[]>([]);
  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msgOk, setMsgOk] = useState<string | null>(null);
  const [msgErr, setMsgErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // ------- cargar usuarios -------
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setMsgErr(null);
    try {
      const r = await api.get("/admin/users");
      const arr: User[] = r.data.items || r.data || [];
      setItems(Array.isArray(arr) ? arr : []);
    } catch (e: any) {
      setMsgErr(e?.response?.data?.detail ?? "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }

  function set<K extends keyof NewUserForm>(k: K, v: NewUserForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // ------- validaciones -------
  const canCreate = useMemo(() => {
    const u = form.username.trim();
    const n = form.full_name.trim();
    const pw = form.password;
    return u.length >= 3 && n.length >= 3 && pw.length >= 6;
  }, [form]);

  async function createUser() {
    if (!canCreate) {
      setMsgErr("Completa usuario/nombre y una contraseña de al menos 6 caracteres.");
      return;
    }
    setSaving(true);
    setMsgOk(null);
    setMsgErr(null);
    try {
      await api.post("/admin/users", form);
      setForm(EMPTY_FORM);
      setMsgOk("Usuario creado correctamente.");
      setTimeout(() => setMsgOk(null), 1500);
      await load();
    } catch (e: any) {
      setMsgErr(e?.response?.data?.detail ?? "No se pudo crear el usuario.");
    } finally {
      setSaving(false);
    }
  }

  // ------- filtro local -------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) =>
      [u.username, u.full_name, u.email ?? "", u.role ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [items, query]);

  return (
    <div className="usr-page">
      <div className="title">Usuarios</div>
      <div className="subtitle">Alta rápida y listado de usuarios del sistema</div>

      <div className="usr-grid">
        {/* --- Alta de usuario --- */}
        <div className="card">
          <div className="subtitle" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FaUserPlus /> Nuevo usuario
          </div>

          <div className="usr-form">
            <div className="usr-row">
              <div className="usr-field">
                <label className="usr-label">Usuario</label>
                <div style={{ position: "relative" }}>
                  <FaUser style={{ position: "absolute", left: 12, top: 12, opacity: 0.6 }} />
                  <input
                    className="usr-input"
                    style={{ paddingLeft: 36 }}
                    placeholder="ej: rfernandez"
                    value={form.username}
                    onChange={(e) => set("username", e.target.value)}
                  />
                </div>
              </div>

              <div className="usr-field">
                <label className="usr-label">Nombre completo</label>
                <input
                  className="usr-input"
                  placeholder="Apellido, Nombre"
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                />
              </div>
            </div>

            <div className="usr-row">
              <div className="usr-field">
                <label className="usr-label">Email</label>
                <div style={{ position: "relative" }}>
                  <FaEnvelope style={{ position: "absolute", left: 12, top: 12, opacity: 0.6 }} />
                  <input
                    className="usr-input"
                    style={{ paddingLeft: 36 }}
                    placeholder="correo@hospital.org"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="usr-field">
                <label className="usr-label">Rol</label>
                <div style={{ position: "relative" }}>
                  <FaShieldAlt style={{ position: "absolute", left: 12, top: 12, opacity: 0.6 }} />
                  <select
                    className="usr-select"
                    style={{ paddingLeft: 36 }}
                    value={form.role_id}
                    onChange={(e) => set("role_id", Number(e.target.value))}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="usr-row">
              <div className="usr-field">
                <label className="usr-label">Contraseña</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    className="usr-input"
                    type={showPw ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn"
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
              <button className="btn primary" onClick={createUser} disabled={saving || !canCreate}>
                <FaSave /> {saving ? "Creando…" : "Crear usuario"}
              </button>
              <button className="btn" type="button" onClick={() => setForm(EMPTY_FORM)} disabled={saving}>
                <FaSync /> Limpiar
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
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr className="usr-row-item" key={u.id}>
                      <td>{u.username}</td>
                      <td>{u.full_name}</td>
                      <td>{u.email || "—"}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`badge ${u.role}`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 16, color: "#9db1cf", textAlign: "center" }}>
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
}