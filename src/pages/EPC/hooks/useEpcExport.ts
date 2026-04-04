// src/pages/EPC/hooks/useEpcExport.ts
// Print, PDF download, copy, and JSON download logic

import { useState } from "react";
import api from "@/api/axios";
import type { EPC, EPCContext } from "@/types/epc";
import { multilineToArray } from "@/utils/format";

function getAuthTokenFromStorage(): string | null {
  const candidates = [
    "token", "access_token", "jwt", "id_token", "auth_token", "AUTH_TOKEN", "ACCESS_TOKEN",
  ];

  for (const k of candidates) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }
  for (const k of candidates) {
    const v = sessionStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }

  const objCandidates = ["auth", "session", "user", "tokens"];
  for (const k of objCandidates) {
    const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const v =
        parsed?.access_token || parsed?.token || parsed?.jwt || parsed?.id_token || parsed?.auth_token;
      if (typeof v === "string" && v.trim()) return v.trim();
    } catch {
      // ignore
    }
  }

  return null;
}

function toBearer(token: string | null): string | null {
  if (!token) return null;
  const t = token.trim();
  if (!t) return null;
  if (t.toLowerCase().startsWith("bearer ")) return t;
  return `Bearer ${t}`;
}

function openBlobInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

export interface UseEpcExportArgs {
  epc: EPC | null;
  generated: EPCContext["generated"] | null;
  motivoText: string;
  evolucionText: string;
  estudiosText: string;
  procedimientosText: string;
  interconsultasText: string;
  tratamientoText: string;
  indicacionesAltaText: string;
  recomendacionesText: string;
  selectedLabsForPdf: Set<string>;
  setToastOk: (v: string | null) => void;
  setToastErr: (v: string | null) => void;
}

export interface EpcExportState {
  onPrint: (epcId: string) => Promise<void>;
  onDownloadPdf: (epcId: string) => Promise<void>;
  copyGenerated: () => void;
  downloadGenerated: () => void;
  saveLabSelectionToEpc: () => Promise<void>;
  savingLabSelection: boolean;
}

export function useEpcExport(args: UseEpcExportArgs): EpcExportState {
  const {
    epc, generated,
    motivoText, evolucionText, estudiosText, procedimientosText,
    interconsultasText, tratamientoText, indicacionesAltaText, recomendacionesText,
    selectedLabsForPdf, setToastOk, setToastErr,
  } = args;

  const [savingLabSelection, setSavingLabSelection] = useState(false);

  async function fetchEpcPdfBlob(epcId: string): Promise<Blob> {
    const token = getAuthTokenFromStorage();
    const bearer = toBearer(token);
    if (!bearer) throw new Error("Not authenticated");

    const res = await api.get(`/epc/${epcId}/print`, {
      responseType: "blob",
      headers: { Authorization: bearer, Accept: "application/pdf" },
    });
    return new Blob([res.data], { type: "application/pdf" });
  }

  async function onPrint(epcId: string) {
    setToastOk(null);
    setToastErr(null);
    try {
      const blob = await fetchEpcPdfBlob(epcId);
      openBlobInNewTab(blob);
    } catch (e: any) {
      setToastErr(e?.response?.data?.detail ?? e?.message ?? "No se pudo imprimir.");
    }
  }

  async function onDownloadPdf(epcId: string) {
    setToastOk(null);
    setToastErr(null);
    try {
      const blob = await fetchEpcPdfBlob(epcId);
      downloadBlob(blob, `epicrisis_${epcId}.pdf`);
    } catch (e: any) {
      setToastErr(e?.response?.data?.detail ?? e?.message ?? "No se pudo descargar.");
    }
  }

  function copyGenerated() {
    const json = JSON.stringify(
      {
        ...((generated && generated.data) || {}),
        motivo_internacion: motivoText,
        evolucion: evolucionText,
        procedimientos: multilineToArray(procedimientosText),
        interconsultas: multilineToArray(interconsultasText),
        medicacion: multilineToArray(tratamientoText),
        indicaciones_alta: multilineToArray(indicacionesAltaText),
        recomendaciones: multilineToArray(recomendacionesText),
      },
      null,
      2
    );
    navigator.clipboard.writeText(json);
    setToastOk("Contenido copiado.");
  }

  function downloadGenerated() {
    const json = JSON.stringify(
      {
        epc_id: epc?.id,
        generated_at: generated?.at,
        model: generated?.model,
        provider: generated?.provider,
        data: {
          ...((generated && generated.data) || {}),
          motivo_internacion: motivoText,
          evolucion: evolucionText,
          procedimientos: multilineToArray(procedimientosText),
          interconsultas: multilineToArray(interconsultasText),
          medicacion: multilineToArray(tratamientoText),
          indicaciones_alta: multilineToArray(indicacionesAltaText),
          recomendaciones: multilineToArray(recomendacionesText),
        },
      },
      null,
      2
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `epc_${epc?.id}_generated.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveLabSelectionToEpc() {
    if (!epc?.id) return;
    setSavingLabSelection(true);
    try {
      const exportConfig = {
        selected_labs: Array.from(selectedLabsForPdf),
        timestamp: new Date().toISOString(),
      };
      await api.patch(`/epc/${epc.id}`, { export_config: exportConfig });
      setToastOk("Seleccion guardada para exportacion PDF");
    } catch (err: any) {
      setToastErr(err?.response?.data?.detail ?? err?.message ?? "Error al guardar seleccion");
    } finally {
      setSavingLabSelection(false);
    }
  }

  return {
    onPrint,
    onDownloadPdf,
    copyGenerated,
    downloadGenerated,
    saveLabSelectionToEpc,
    savingLabSelection,
  };
}
