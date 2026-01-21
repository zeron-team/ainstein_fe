// frontend/src/pages/ErrorPage.tsx
import React from "react";
import {
  useRouteError,
  isRouteErrorResponse,
} from "react-router-dom";

/**
 * Tipo liviano para representar la estructura del error de ruta,
 * sin depender de tipos de react-router-dom.
 */
type RouteErrorResponseLike = {
  status: number;
  statusText?: string;
  data?: any;
};

/**
 * Convierte cualquier cosa en un string seguro para renderizar en JSX.
 */
function toSafeString(x: any): string {
  if (x === null || x === undefined) return "";
  if (
    typeof x === "string" ||
    typeof x === "number" ||
    typeof x === "boolean"
  ) {
    return String(x);
  }
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
}

/**
 * Extrae un mensaje legible desde el error de React Router / backend
 * (incluyendo FastAPI 422 con objetos {type, loc, msg, input}).
 */
function extractRouteErrorMessage(error: unknown): string {
  // Caso 1: error es una "RouteErrorResponse" (thrown response) de React Router
  if (isRouteErrorResponse(error)) {
    const err = error as RouteErrorResponseLike;
    const data = (err.data ?? {}) as any;

    // FastAPI suele mandar { detail: ... }
    if (data && data.detail) {
      const detail = data.detail;

      if (typeof detail === "string") {
        return `[${err.status}] ${detail}`;
      }

      if (Array.isArray(detail)) {
        const msg = detail
          .map((d: any) => {
            const loc = Array.isArray(d.loc) ? d.loc.slice(1).join(".") : "";
            const m = d.msg ?? "";
            const locStr = loc ? `${loc}: ` : "";
            return `${locStr}${toSafeString(m)}`;
          })
          .join(" | ");
        return `[${err.status}] ${msg}`;
      }
    }

    // Otros formatos típicos
    if (data && typeof data.message === "string") {
      return `[${err.status}] ${data.message}`;
    }

    return `[${err.status}] ${err.statusText || "Error en la ruta"}`;
  }

  // Caso 2: Error clásico de JS
  if (error instanceof Error) {
    return error.message;
  }

  // Caso 3: cualquier otra cosa
  return toSafeString(error);
}

const ErrorPage: React.FC = () => {
  const error = useRouteError();

  const message = extractRouteErrorMessage(error);

  // Debug seguro (todo string)
  let debugInfo = "";
  try {
    debugInfo = JSON.stringify(error, null, 2);
  } catch {
    debugInfo = toSafeString(error);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px 24px",
        background: "#040816",
        color: "#e6ecf7",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 840,
          margin: "0 auto",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.12)",
          background:
            "radial-gradient(circle at top left, rgba(80,180,255,0.25), transparent 55%), rgba(5,10,25,0.95)",
          padding: 24,
          boxShadow: "0 18px 45px rgba(0,0,0,0.65)",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Algo salió mal
        </h1>
        <p style={{ fontSize: 14, color: "#a0b3d8", marginBottom: 16 }}>
          Ocurrió un error al cargar esta pantalla. Podés volver al inicio o
          reintentar la operación.
        </p>

        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,140,140,0.5)",
            background: "rgba(80,0,0,0.25)",
            fontSize: 13,
          }}
        >
          {message}
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            borderRadius: 999,
            border: "1px solid rgba(80,180,255,0.7)",
            background:
              "linear-gradient(135deg, rgba(42,95,255,0.95), rgba(63,178,255,0.95))",
            color: "#f5f8ff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Volver al dashboard
        </button>

        <details
          style={{
            marginTop: 18,
            fontSize: 12,
            color: "#93a3c5",
          }}
        >
          <summary>Detalles técnicos</summary>
          <pre
            style={{
              marginTop: 8,
              padding: 10,
              borderRadius: 8,
              background: "rgba(3,10,30,0.9)",
              border: "1px solid rgba(255,255,255,0.08)",
              maxHeight: 260,
              overflow: "auto",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 11,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {debugInfo}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default ErrorPage;