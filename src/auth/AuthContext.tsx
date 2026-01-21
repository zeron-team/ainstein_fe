// src/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "@/api/axios";

type Role = "admin" | "medico" | "viewer";

type User = {
  id: string;
  username: string;
  role: Role;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// JWT base64url -> JSON
function decodeJwt(token: string): any {
  try {
    const part = token.split(".")[1];
    if (!part) return null;

    // base64url -> base64
    let base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    // padding
    while (base64.length % 4 !== 0) base64 += "=";

    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function persistToken(tok: string) {
  // guardamos en keys más comunes para que TODO el sistema lo encuentre
  localStorage.setItem("token", tok);
  localStorage.setItem("access_token", tok);
  localStorage.setItem("AUTH_TOKEN", tok);
  localStorage.setItem("ACCESS_TOKEN", tok);

  // seteo global en axios
  api.defaults.headers.common.Authorization = `Bearer ${tok}`;
}

function clearToken() {
  const keys = [
    "token",
    "access_token",
    "AUTH_TOKEN",
    "ACCESS_TOKEN",
    "jwt",
    "id_token",
    "auth_token",
  ];
  keys.forEach((k) => localStorage.removeItem(k));
  keys.forEach((k) => sessionStorage.removeItem(k));
  delete (api.defaults.headers.common as any).Authorization;
}

function normalizeRole(payload: any): Role {
  const roleRaw =
    payload?.role ??
    payload?.rol ??
    payload?.user_role ??
    (Array.isArray(payload?.roles) ? payload.roles[0] : undefined) ??
    (Array.isArray(payload?.authorities) ? payload.authorities[0] : undefined);

  const r = String(roleRaw || "viewer").toLowerCase();

  if (r === "admin") return "admin";
  if (r === "medico" || r === "doctor" || r === "odontologo") return "medico";
  return "viewer";
}

function buildUserFromPayload(payload: any, fallbackUsername = "user"): User {
  const id = String(payload?.sub ?? payload?.id ?? payload?.user_id ?? "");
  const username =
    payload?.username ??
    payload?.preferred_username ??
    payload?.email ??
    payload?.name ??
    fallbackUsername;

  return {
    id: id || "0",
    username: String(username),
    role: normalizeRole(payload),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // rehidratar sesión
  useEffect(() => {
    const saved =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("access_token") ||
      sessionStorage.getItem("token");

    if (saved) {
      const payload = decodeJwt(saved);
      const now = Math.floor(Date.now() / 1000);

      if (payload?.exp && payload.exp > now) {
        setToken(saved);
        persistToken(saved);

        setUser(buildUserFromPayload(payload, "user"));
      } else {
        clearToken();
      }
    }

    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setError(null);

    try {
      const { data } = await api.post("/auth/login", { username, password });

      const tok = (data?.access_token as string) || (data?.token as string) || "";
      if (!tok) {
        setError("Respuesta de login inválida");
        throw new Error("Respuesta de login inválida");
      }

      persistToken(tok);
      setToken(tok);

      const payload = decodeJwt(tok);
      setUser(buildUserFromPayload(payload, username));
    } catch (e: any) {
      // Intento de mensaje legible
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Error de autenticación";
      setError(String(msg));
      throw e;
    }
  };

  const logout = () => {
    clearToken();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, loading, error, login, logout }),
    [token, user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};