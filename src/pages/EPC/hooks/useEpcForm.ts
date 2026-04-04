// src/pages/EPC/hooks/useEpcForm.ts
// Form state management, save and generate logic

import { useState, useMemo, useEffect } from "react";
import api from "@/api/axios";
import type { EPC, EPCContext } from "@/types/epc";
import { multilineToArray } from "@/utils/format";

export interface UseEpcFormArgs {
  epc: EPC | null;
  generated: EPCContext["generated"] | null;
  titulo: string;
  cie10: string;
  fechaEmision: string;
  firmado: boolean;
  medicoNombre: string;
  motivoText: string;
  evolucionText: string;
  estudiosText: string;
  procedimientosText: string;
  interconsultasText: string;
  tratamientoText: string;
  indicacionesAltaText: string;
  recomendacionesText: string;
  loadContext: (id: string, opts?: { silent?: boolean }) => Promise<void>;
  setResetEditingFlags: (fn: () => void) => void;
}

export interface EpcFormState {
  saving: boolean;
  generating: boolean;
  toastOk: string | null;
  toastErr: string | null;
  setToastOk: (v: string | null) => void;
  setToastErr: (v: string | null) => void;

  // Editing flags
  editingMotivo: boolean;
  editingEvolucion: boolean;
  editingEstudios: boolean;
  editingProc: boolean;
  editingInter: boolean;
  editingTrat: boolean;
  editingIndAlta: boolean;
  editingRecom: boolean;
  setEditingMotivo: (v: boolean) => void;
  setEditingEvolucion: (v: boolean) => void;
  setEditingEstudios: (v: boolean) => void;
  setEditingProc: (v: boolean) => void;
  setEditingInter: (v: boolean) => void;
  setEditingTrat: (v: boolean) => void;
  setEditingIndAlta: (v: boolean) => void;
  setEditingRecom: (v: boolean) => void;

  isAnyEditing: boolean;

  onSave: () => Promise<void>;
  onGenerate: () => Promise<void>;
}

export function useEpcForm(args: UseEpcFormArgs): EpcFormState {
  const {
    epc, generated, titulo, cie10, fechaEmision, firmado, medicoNombre,
    motivoText, evolucionText, estudiosText, procedimientosText,
    interconsultasText, tratamientoText, indicacionesAltaText, recomendacionesText,
    loadContext, setResetEditingFlags,
  } = args;

  const [saving, setSaving] = useState(false);
  const [toastOk, setToastOk] = useState<string | null>(null);
  const [toastErr, setToastErr] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Editing flags
  const [editingMotivo, setEditingMotivo] = useState(false);
  const [editingEvolucion, setEditingEvolucion] = useState(false);
  const [editingEstudios, setEditingEstudios] = useState(false);
  const [editingProc, setEditingProc] = useState(false);
  const [editingInter, setEditingInter] = useState(false);
  const [editingTrat, setEditingTrat] = useState(false);
  const [editingIndAlta, setEditingIndAlta] = useState(false);
  const [editingRecom, setEditingRecom] = useState(false);

  const isAnyEditing = editingMotivo || editingEvolucion || editingEstudios || editingProc || editingInter || editingTrat || editingIndAlta || editingRecom;

  // Register the reset callback with the context hook
  useEffect(() => {
    setResetEditingFlags(() => {
      setEditingMotivo(false);
      setEditingEvolucion(false);
      setEditingEstudios(false);
      setEditingProc(false);
      setEditingInter(false);
      setEditingTrat(false);
      setEditingIndAlta(false);
      setEditingRecom(false);
    });
  }, [setResetEditingFlags]);

  async function onSave() {
    if (!epc) return;
    setSaving(true);
    setToastOk(null);
    setToastErr(null);
    try {
      const baseGenData: any =
        generated && generated.data && typeof generated.data === "object"
          ? generated.data
          : {};

      const updatedGeneratedData: any = {
        ...baseGenData,
        motivo_internacion: motivoText.trim(),
        evolucion: evolucionText.trim(),
        estudios: multilineToArray(estudiosText),
        procedimientos: multilineToArray(procedimientosText),
        interconsultas: multilineToArray(interconsultasText),
        medicacion: multilineToArray(tratamientoText),
        indicaciones_alta: multilineToArray(indicacionesAltaText),
        recomendaciones: multilineToArray(recomendacionesText),
      };

      const payload: Record<string, any> = {
        titulo,
        diagnostico_principal_cie10: cie10 || null,
        fecha_emision: fechaEmision || null,
        firmado_por_medico: firmado,
        medico_responsable: medicoNombre || null,
      };

      if (generated) {
        payload.generated = {
          ...generated,
          data: updatedGeneratedData,
        };
      }

      await api.patch(`/epc/${epc.id}`, payload);
      setToastOk("Cambios guardados correctamente.");
    } catch (e: any) {
      setToastErr(e?.response?.data?.detail ?? "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function onGenerate() {
    if (!epc) return;
    if (generating) return;
    setToastOk(null);
    setToastErr(null);
    setGenerating(true);
    try {
      await api.post(`/epc/${epc.id}/generate`);
      await loadContext(epc.id, { silent: true });
      setToastOk("Contenido generado correctamente.");
    } catch (e: any) {
      setToastErr(e?.response?.data?.detail ?? "No se pudo generar.");
    } finally {
      setGenerating(false);
    }
  }

  return {
    saving,
    generating,
    toastOk,
    toastErr,
    setToastOk,
    setToastErr,

    editingMotivo, setEditingMotivo,
    editingEvolucion, setEditingEvolucion,
    editingEstudios, setEditingEstudios,
    editingProc, setEditingProc,
    editingInter, setEditingInter,
    editingTrat, setEditingTrat,
    editingIndAlta, setEditingIndAlta,
    editingRecom, setEditingRecom,

    isAnyEditing,
    onSave,
    onGenerate,
  };
}
