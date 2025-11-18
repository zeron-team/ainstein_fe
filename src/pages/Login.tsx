// frontend/src/pages/Login.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import {
  FaSignInAlt,
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaInfoCircle,
} from "react-icons/fa";

const STYLE_ID = "login-styles";

const Login: React.FC = () => {
  // ---- inyectamos estilos una sola vez ----
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement("style");
      s.id = STYLE_ID;
      s.innerHTML = `
      .lg-wrap {
        min-height: 100vh; display:grid; place-items:center;
        background:
          radial-gradient(1200px 600px at 75% -10%, rgba(80,180,255,.12), transparent 60%),
          radial-gradient(1200px 600px at -10% 100%, rgba(80,120,255,.10), transparent 60%),
          #061025;
        color:#eaf1ff; padding: 24px;
      }
      .lg-card {
        width:100%; max-width: 920px; display:grid; grid-template-columns: 1fr;
        border:1px solid rgba(255,255,255,.08);
        background: linear-gradient(180deg, rgba(10,20,40,.85), rgba(8,15,30,.85));
        border-radius: 18px; overflow:hidden; box-shadow: 0 10px 40px rgba(0,0,0,.45);
      }
      @media (min-width: 980px) { .lg-card { grid-template-columns: 1.1fr .9fr; } }

      .lg-brand {
        padding: 28px; background:
          radial-gradient(700px 380px at -10% -10%, rgba(70,130,255,.18), transparent 60%),
          radial-gradient(700px 380px at 120% 120%, rgba(70,220,255,.14), transparent 60%),
          rgba(255,255,255,.03);
        border-right: 1px solid rgba(255,255,255,.08);
        display:flex; flex-direction:column; justify-content:space-between;
      }
      .lg-brand h1 { font-size: 26px; font-weight: 800; letter-spacing:.3px; margin: 0 0 6px; }
      .lg-brand p  { color:#9db1cf; margin: 0; }
      .lg-badges { display:flex; flex-wrap:wrap; gap:8px; margin-top: 14px; }
      .lg-badge {
        font-size:12px; padding:6px 10px; border-radius:999px;
        border:1px solid rgba(255,255,255,.14); color:#cfe3ff; background: rgba(255,255,255,.05);
      }
      .lg-brand-footer { font-size: 12px; color:#91a6c8; opacity:.9; }

      .lg-form { padding: 28px; display:grid; gap:14px; }
      .lg-title { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
      .lg-sub  { color:#9db1cf; font-size: 13px; margin-bottom: 6px; }

      .lg-field { display:flex; flex-direction:column; gap:6px; }
      .lg-label { font-size: 12px; color:#9db1cf; }
      .lg-input-wrap { position: relative; display:flex; align-items:center; }
      .lg-ico-l { position:absolute; left:12px; opacity:.65; }
      .lg-ico-r { position:absolute; right:8px; opacity:.85; }
      .lg-input {
        width:100%; padding: 12px 40px 12px 38px; font-size:14px; color:#eaf1ff;
        background: rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);
        border-radius: 12px; outline: none;
      }
      .lg-input:focus { border-color: rgba(80,180,255,.5); box-shadow: 0 0 0 3px rgba(80,180,255,.14); }

      .lg-row { display:flex; align-items:center; justify-content:space-between; gap:12px; }
      .lg-check { display:flex; align-items:center; gap:8px; font-size: 13px; color:#cfe3ff; }
      .lg-link { font-size: 13px; color:#8ec8ff; text-decoration:none; }
      .lg-link:hover { text-decoration:underline; }

      .lg-btn {
        width:100%; display:inline-flex; align-items:center; justify-content:center; gap:10px;
        padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,.12);
        background: linear-gradient(135deg,#2a5fff,#3fb2ff); color:#ffffff;
        font-weight: 700; letter-spacing:.2px; cursor:pointer; transition: transform .12s ease;
      }
      .lg-btn:hover { transform: translateY(-1px); }
      .lg-btn:disabled { opacity:.65; cursor:not-allowed; transform:none; }

      .lg-toast { display:flex; gap:8px; align-items:flex-start; border-radius:12px; padding:10px 12px; font-size:13px; }
      .lg-toast.err { background: rgba(255,70,70,.12); border:1px solid rgba(255,120,120,.28); color:#ffd6d6; }
      .lg-toast.ok  { background: rgba(60,220,140,.12); border:1px solid rgba(90,230,150,.28); color:#bff4d7; }
      .lg-caps { font-size: 12px; color:#ffd5a3; display:flex; align-items:center; gap:6px; }
      `;
      document.head.appendChild(s);
    }
  }, []);

  const { login, error } = useAuth();
  const nav = useNavigate();

  const lastUser = useMemo(() => localStorage.getItem("last_username") ?? "", []);
  const [username, setUsername] = useState<string>(lastUser || "admin");
  const [password, setPassword] = useState<string>("TuPassFuerte123!");
  const [remember, setRemember] = useState<boolean>(!!lastUser);
  const [showPw, setShowPw] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [caps, setCaps] = useState<boolean>(false);

  const canSubmit = username.trim().length > 0 && password.length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setLocalError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      if (remember) localStorage.setItem("last_username", username);
      else localStorage.removeItem("last_username");
      nav("/", { replace: true });
    } catch (err: any) {
      setLocalError(err?.response?.data?.detail ?? "Credenciales inválidas");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lg-wrap">
      <div className="lg-card">
        {/* Panel de marca */}
        <div className="lg-brand">
          <div>
            <h1>EPC Suite</h1>
            <p>Plataforma clínica moderna para gestionar Epicrisis y pacientes.</p>
            <div className="lg-badges">
              <span className="lg-badge">FastAPI</span>
              <span className="lg-badge">React + TS</span>
              <span className="lg-badge">JWT</span>
              <span className="lg-badge">Hosp. ready</span>
            </div>
          </div>
          <div className="lg-brand-footer">© {new Date().getFullYear()} EPC Suite — Todos los derechos reservados</div>
        </div>

        {/* Formulario */}
        <form className="lg-form" onSubmit={onSubmit}>
          <div className="lg-title">Ingresar</div>
          <div className="lg-sub">Usá tus credenciales para acceder al panel.</div>

          {(localError || error) && (
            <div className="lg-toast err" role="alert">
              <FaInfoCircle style={{ marginTop: 2 }} />
              <div>{localError || error}</div>
            </div>
          )}

          {/* Usuario */}
          <div className="lg-field">
            <label className="lg-label" htmlFor="lg-username">Usuario</label>
            <div className="lg-input-wrap">
              <FaUser className="lg-ico-l" />
              <input
                id="lg-username"
                className="lg-input"
                placeholder="usuario"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyUp={(e) => setCaps(e.getModifierState && e.getModifierState("CapsLock"))}
              />
            </div>
          </div>

          {/* Clave */}
          <div className="lg-field">
            <label className="lg-label" htmlFor="lg-password">Clave</label>
            <div className="lg-input-wrap">
              <FaLock className="lg-ico-l" />
              <input
                id="lg-password"
                className="lg-input"
                type={showPw ? "text" : "password"}
                placeholder="tu contraseña"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={(e) => setCaps(e.getModifierState && e.getModifierState("CapsLock"))}
              />
              <button
                type="button"
                className="lg-ico-r"
                aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPw((v) => !v)}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                {showPw ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {caps && (
              <div className="lg-caps">
                <FaInfoCircle /> Bloq Mayús activado
              </div>
            )}
          </div>

          {/* Opciones */}
          <div className="lg-row">
            <label className="lg-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Recordar usuario
            </label>
            {/* Enlace opcional */}
            <a className="lg-link" href="#" onClick={(e) => e.preventDefault()}>
              ¿Olvidaste tu clave?
            </a>
          </div>

          {/* Botón */}
          <button className="lg-btn" disabled={!canSubmit || submitting}>
            <FaSignInAlt /> {submitting ? "Ingresando…" : "Ingresar"}
          </button>

          {/* Hint de demo */}
          {!localError && !error && (
            <div className="lg-toast ok" style={{ marginTop: 6 }}>
              <FaCheck />
              <div>Tip: podés probar con <b>admin / TuPassFuerte123!</b></div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;