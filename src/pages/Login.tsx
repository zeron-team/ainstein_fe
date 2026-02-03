// frontend/src/pages/Login.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeartbeat } from "react-icons/fa";
import { useAuth } from "@/auth/AuthContext";
import {
  FaSignInAlt,
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaInfoCircle,
} from "react-icons/fa";

// Estilos externos
import "./Login.css";

// Logo
import AInsteinLogo from "../../Isologo_AInstein.png";

const Login: React.FC = () => {
  const { login, error } = useAuth();
  const nav = useNavigate();

  const lastUser = useMemo(() => localStorage.getItem("last_username") ?? "", []);
  const [username, setUsername] = useState<string>(lastUser || "admin");
  const [password, setPassword] = useState<string>("Admin123!");
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
    <div className="login-wrap">
      <div className="login-card">
        {/* Panel de marca */}
        <div className="login-brand">
          <div className="login-brand-content">
            <h1>EPC Builder</h1>
            <p>
              Plataforma para gestionar Epicrisis a través de IA.
            </p>

            {/* Logo */}
            <div className="login-logo-wrap">
              <img
                src={AInsteinLogo}
                alt="AInstein"
                className="login-logo"
              />
            </div>

            {/* Badges */}
            <div className="login-badges">
              <span className="login-badge">IA Generativa</span>
              <span className="login-badge">HIPAA Ready</span>
              <span className="login-badge">Multi-Tenant</span>
            </div>
          </div>

          <div className="login-brand-footer">
            <span>EPC Builder by AInstein © {new Date().getFullYear()}</span>
            <FaHeartbeat />
            <span>powered by ZRN Health</span>
          </div>
        </div>

        {/* Formulario */}
        <form className="login-form" onSubmit={onSubmit}>
          <h2 className="login-form-title">Bienvenido</h2>
          <p className="login-form-subtitle">
            Ingresá tus credenciales para acceder al panel.
          </p>

          {(localError || error) && (
            <div className="login-toast login-toast-error" role="alert">
              <FaInfoCircle />
              <div>{localError || error}</div>
            </div>
          )}

          {/* Usuario */}
          <div className="login-field">
            <label className="login-label" htmlFor="login-username">
              Usuario
            </label>
            <div className="login-input-wrap">
              <FaUser className="login-input-icon" />
              <input
                id="login-username"
                className="login-input"
                placeholder="tu usuario"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyUp={(e) =>
                  setCaps(e.getModifierState && e.getModifierState("CapsLock"))
                }
              />
            </div>
          </div>

          {/* Clave */}
          <div className="login-field">
            <label className="login-label" htmlFor="login-password">
              Contraseña
            </label>
            <div className="login-input-wrap">
              <FaLock className="login-input-icon" />
              <input
                id="login-password"
                className="login-input"
                type={showPw ? "text" : "password"}
                placeholder="tu contraseña"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={(e) =>
                  setCaps(e.getModifierState && e.getModifierState("CapsLock"))
                }
              />
              <button
                type="button"
                className="login-input-icon-right"
                aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {caps && (
              <div className="login-caps-warning">
                <FaInfoCircle /> Bloq Mayús activado
              </div>
            )}
          </div>

          {/* Opciones */}
          <div className="login-options">
            <label className="login-checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Recordar usuario
            </label>
            <a
              className="login-link"
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              ¿Olvidaste tu clave?
            </a>
          </div>

          {/* Botón */}
          <button className="login-btn" disabled={!canSubmit || submitting}>
            <FaSignInAlt /> {submitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;