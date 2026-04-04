// src/utils/format.ts
// Shared date/name formatting utilities used across EPC, patients, and HCE views

/**
 * Convert an ISO date string (or YYYY-MM-DD) to YYYY-MM-DD format.
 */
export function isoToYmd(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T00:00:00");
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
}

/**
 * Today's date as YYYY-MM-DD.
 */
export function ymdToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Convert any date-like value (ISO, YYYY-MM-DD, dd/mm/yyyy) to YYYY-MM-DD.
 */
export function anyToYmd(val?: string | null): string {
  if (!val) return "";
  const s = val.trim();
  if (!s) return "";
  if (s.includes("-")) return isoToYmd(s);
  if (s.includes("/")) {
    const parts = s.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const yy = y?.trim();
      const mm = String(parseInt(m || "0", 10)).padStart(2, "0");
      const dd = String(parseInt(d || "0", 10)).padStart(2, "0");
      if (yy && mm !== "NaN" && dd !== "NaN") return `${yy}-${mm}-${dd}`;
    }
  }
  return isoToYmd(s);
}

/**
 * Format an ISO datetime to a human-friendly string: DD/MM/YYYY HH:mm.
 */
export function formatHistoryDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  } catch {
    return iso;
  }
}

/**
 * Format a datetime-like string to display format: "YYYY-MM-DD HH:mm:ss" → trimmed.
 */
export function fmtDt(v?: string | null): string {
  if (!v) return "-";
  return String(v)
    .replace("T", " ")
    .replace("Z", "")
    .replace(/\.\d+/, "")
    .trim();
}

/**
 * Build "Apellido, Nombre" from a patient-like object.
 */
export function fullName(patient?: { apellido?: string | null; nombre?: string | null } | null): string {
  const ap = (patient?.apellido || "").trim();
  const no = (patient?.nombre || "").trim();
  return [ap, no].filter(Boolean).join(", ");
}

/**
 * Convert an array of items (strings or objects with farmaco/descripcion/detalle/resumen) to multiline text.
 */
export function arrToMultiline(arr: any[] | undefined): string {
  if (!Array.isArray(arr) || !arr.length) return "";
  return arr
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        if ((item as any).farmaco) {
          const t = item as { farmaco: string; dosis?: string; via?: string; frecuencia?: string };
          return [t.farmaco, t.dosis, t.via, t.frecuencia].filter(Boolean).join(" · ");
        }
        return (
          (item as any).descripcion ||
          (item as any).detalle ||
          (item as any).resumen ||
          (item as any).especialidad ||
          JSON.stringify(item)
        );
      }
      return String(item ?? "");
    })
    .join("\n");
}

/**
 * Convert multiline text to an array of non-empty trimmed lines.
 */
export function multilineToArray(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Strip HTML tags from a value.
 */
export function stripHtml(v: any): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : safeText(v);
  return s.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

/**
 * Safely convert any value to displayable text.
 */
export function safeText(v: any): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

/**
 * Format dose + unit.
 */
export function fmtDose(dose: any, unit?: string | null): string {
  const d = dose === null || dose === undefined ? "" : String(dose).trim();
  const u = unit ? String(unit).trim() : "";
  const x = [d, u].filter(Boolean).join(" ");
  return x || "-";
}

/**
 * Safely cast value to an array, returning [] if not an array.
 */
export function toArray<T>(v: any): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/**
 * Normalize a string for case-insensitive comparison: lowercase, strip accents, collapse whitespace.
 */
export function normalizeKey(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse any date-like string to epoch milliseconds (0 if unparseable).
 */
/**
 * Convert ALL CAPS words in a string to Title Case.
 * Preserves a leading date/time prefix (e.g. "08/01/2026 15:00 - ").
 * Works per-word: any word that is fully uppercase (3+ letters) gets title-cased.
 */
export function smartTitleCase(s: string): string {
  if (!s) return s;
  // Match optional date/time prefix: "DD/MM/YYYY HH:MM - " or "DD/MM/YYYY HH:MM:SS - "
  const prefixMatch = s.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)\s*-\s*(.*)$/);
  let prefix = "";
  let desc = s;
  if (prefixMatch) {
    prefix = prefixMatch[1] + " - ";
    desc = prefixMatch[2];
  }

  // Check if there are any ALL CAPS words (3+ letters) worth converting
  const hasAllCapsWords = /[A-ZÁÉÍÓÚÑÜ]{3,}/.test(desc);
  if (!hasAllCapsWords) return s;

  // Small connectors to keep lowercase
  const connectors = new Set(["de", "del", "en", "con", "por", "a", "e", "y", "o", "la", "las", "el", "los", "un", "una", "al"]);

  // Process each word individually, preserving whitespace
  const words = desc.split(/(\s+)/);
  const result = words.map((token) => {
    // Skip whitespace tokens
    if (/^\s+$/.test(token)) return token;
    // Check if word is ALL CAPS (only letters, 3+ chars)
    const lettersOnly = token.replace(/[^a-záéíóúñüA-ZÁÉÍÓÚÑÜ]/g, "");
    if (lettersOnly.length >= 3 && lettersOnly === lettersOnly.toUpperCase() && /[A-ZÁÉÍÓÚÑÜ]/.test(lettersOnly)) {
      const lower = token.toLowerCase();
      if (connectors.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }
    return token;
  }).join("");

  return prefix + result;
}

/**
 * Convert an array to multiline text, applying smartTitleCase to each line.
 */
export function arrToMultilineTitleCase(arr: any[] | undefined): string {
  const raw = arrToMultiline(arr);
  if (!raw) return raw;
  return raw.split("\n").map(smartTitleCase).join("\n");
}

export function toMsFromAnyDateLike(v?: string | null): number {
  if (!v) return 0;
  const raw = String(v).trim();
  let t = new Date(raw).getTime();
  if (!Number.isNaN(t)) return t;
  const isoish = raw.includes(" ") && !raw.includes("T") ? raw.replace(" ", "T") : raw;
  t = new Date(isoish).getTime();
  if (!Number.isNaN(t)) return t;
  return 0;
}
