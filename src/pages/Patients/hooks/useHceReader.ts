// src/pages/Patients/hooks/useHceReader.ts

import { useMemo, useRef, useState } from "react";
import api from "@/api/axios";
import { formatApiError } from "@/utils/error";
import { fmtDt, toArray } from "@/utils/format";
import {
  PacienteItem,
  HceDoc,
  AinsteinEpisodio,
  AinsteinMovimiento,
  AinsteinHistoriaEntrada,
} from "../types";
import { buildGroupedClinicalText } from "../components/HceReaderModal/hceRenderHelpers";

export function useHceReader() {
  const [hceOpen, setHceOpen] = useState(false);
  const [hceLoading, setHceLoading] = useState(false);
  const [hceError, setHceError] = useState<string | null>(null);
  const [hcePatient, setHcePatient] = useState<PacienteItem | null>(null);
  const [hceDoc, setHceDoc] = useState<HceDoc | null>(null);
  const [hceTab, setHceTab] = useState<"vista" | "texto" | "json">("vista");
  const [expandedEntr, setExpandedEntr] = useState<Record<number, boolean>>({});

  const hceAbortRef = useRef<AbortController | null>(null);

  const hasAinsteinHistoria = useMemo(() => {
    const hist = hceDoc?.ainstein?.historia;
    return Array.isArray(hist) && hist.length > 0;
  }, [hceDoc]);

  const episodio = useMemo<AinsteinEpisodio | null>(() => {
    const ep = hceDoc?.ainstein?.episodio as any;
    if (!ep || typeof ep !== "object") return null;
    return ep as AinsteinEpisodio;
  }, [hceDoc]);

  const ubicacion = useMemo(() => {
    const movs = toArray<AinsteinMovimiento>(episodio?.movimientos);
    const m0 = movs[0];
    const sala = m0?.salaDescripcion ? String(m0.salaDescripcion).trim() : "";
    const unidad = m0?.nicuDescripcion ? String(m0.nicuDescripcion).trim() : "";
    const when = m0?.inmoFechaDesde ? fmtDt(m0.inmoFechaDesde) : "";
    const label = [sala, unidad].filter(Boolean).join(" • ");
    return {
      label: label || "-",
      when: when || "-",
    };
  }, [episodio]);

  const structuredSummary = useMemo(() => {
    const s: any = hceDoc?.structured || {};
    const ingreso =
      s?.fecha_ingreso ||
      s?.ainstein?.inteFechaIngreso ||
      s?.inteFechaIngreso ||
      episodio?.inteFechaIngreso;

    const egresoOriginal =
      s?.fecha_egreso_original ||
      s?.fecha_egreso ||
      episodio?.inteFechaEgreso;

    return {
      fecha_ingreso: ingreso ? fmtDt(String(ingreso)) : "-",
      fecha_egreso_original: egresoOriginal ? fmtDt(String(egresoOriginal)) : "-",
      sector: s?.sector || s?.nicuDescripcion || s?.salaDescripcion || "-",
      habitacion: s?.habitacion || "-",
      cama: s?.cama || "-",
      obra_social: s?.obra_social || hcePatient?.obra_social || "-",
      nro_beneficiario: s?.nro_beneficiario || hcePatient?.nro_beneficiario || "-",
      estado_internacion: s?.estado_internacion || hcePatient?.estado || "-",
      protocolo: s?.protocolo || "-",
      admision_num: s?.admision_num || hcePatient?.hce_numero || "-",
      sexo: s?.sexo || episodio?.paciSexo || "-",
      edad: s?.edad || episodio?.paciEdad || "-",
      dias_estada: s?.dias_estada || episodio?.inteDiasEstada || "-",
      tipo_alta: s?.tipo_alta || episodio?.taltDescripcion || "-",
      fecha_ingreso_raw: ingreso ? String(ingreso) : null,
      fecha_egreso_raw: egresoOriginal ? String(egresoOriginal) : null,
    };
  }, [hceDoc, hcePatient, episodio]);

  function toggleAll(open: boolean) {
    const hist = toArray<AinsteinHistoriaEntrada>(hceDoc?.ainstein?.historia);
    const next: Record<number, boolean> = {};
    hist.forEach((h) => (next[h.entrCodigo] = open));
    setExpandedEntr(next);
  }

  const groupedText = useMemo(() => {
    if (!hceDoc) return "(Sin texto)";
    return buildGroupedClinicalText({
      doc: hceDoc,
      patient: hcePatient,
      structuredSummary,
      episodio,
      ubicacion,
    });
  }, [hceDoc, hcePatient, structuredSummary, episodio, ubicacion]);

  async function openHceReader(p: PacienteItem) {
    try {
      if (hceAbortRef.current) hceAbortRef.current.abort();
      const controller = new AbortController();
      hceAbortRef.current = controller;

      setHceError(null);
      setHceLoading(true);
      setHceOpen(true);
      setHcePatient(p);
      setHceDoc(null);
      setHceTab("vista");
      setExpandedEntr({});

      const { data } = await api.get<HceDoc>("/hce/latest", {
        params: { patient_id: p.id, include_text: 1 },
        signal: controller.signal,
      });

      setHceDoc(data);
    } catch (e: any) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      setHceError(formatApiError(e, "No se pudo abrir la HCE"));
      setHceDoc(null);
    } finally {
      setHceLoading(false);
    }
  }

  function closeHceReader() {
    if (hceAbortRef.current) hceAbortRef.current.abort();
    setHceOpen(false);
    setHceLoading(false);
    setHceError(null);
    setHcePatient(null);
    setHceDoc(null);
    setHceTab("vista");
    setExpandedEntr({});
  }

  return {
    hceOpen,
    hceLoading,
    hceError,
    hcePatient,
    hceDoc,
    hceTab,
    setHceTab,
    expandedEntr,
    setExpandedEntr,
    hasAinsteinHistoria,
    episodio,
    ubicacion,
    structuredSummary,
    groupedText,
    toggleAll,
    openHceReader,
    closeHceReader,
  };
}
