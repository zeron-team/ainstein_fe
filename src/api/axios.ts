// frontend/src/api/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000",
  withCredentials: false,
});

// intenta varias keys comunes por si difiere el guardado
function getToken(): string | null {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("AUTH_TOKEN") ||
    null
  );
}

// REQUEST: adjunta Authorization si hay token
api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

// RESPONSE: si 401 -> limpia y al /login
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("AUTH_TOKEN");
      // evita loop si ya estás en /login
      if (!location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;