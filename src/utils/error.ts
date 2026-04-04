// src/utils/error.ts
// Unified error formatting for API responses

/**
 * Extract a readable error message from an Axios/FastAPI error response.
 * Handles: string detail, array of ValidationError, object detail, generic Error.message.
 */
export function formatApiError(e: any, fallback = "Error inesperado"): string {
  const detail = e?.response?.data?.detail;

  if (Array.isArray(detail)) {
    const msgs = detail.map((d: any) => {
      if (typeof d === "string") return d;
      if (d?.msg) return d.msg;
      try {
        return JSON.stringify(d);
      } catch {
        return String(d);
      }
    });
    return msgs.join(" | ") || fallback;
  }

  if (typeof detail === "string") return detail;

  if (detail && typeof detail === "object") {
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }

  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.response?.data?.error) return e.response.data.error;
  if (e?.message) return e.message;

  return fallback;
}
