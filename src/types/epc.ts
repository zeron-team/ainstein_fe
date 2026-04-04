// src/types/epc.ts
// Shared EPC types used across ViewEdit, List, FeedbackDashboard

import type { Patient, Admission, Doctor } from "./patient";

export type EPC = {
  id: string;
  patient_id: string;
  admission_id?: string | null;
  estado: "borrador" | "validada" | "impresa";
  titulo?: string | null;
  diagnostico_principal_cie10?: string | null;
  fecha_emision?: string | null;
  medico_responsable?: string | null;
  firmado_por_medico?: boolean | null;
  sector?: string | null;
  habitacion?: string | null;
  cama?: string | null;
  admision_num?: string | null;
  protocolo?: string | null;
};

export type GeneratedData = {
  motivo_internacion?: string;
  diagnostico_principal_cie10?: string;
  evolucion?: string;
  estudios?: any[];
  procedimientos?: any[];
  interconsultas?: any[];
  interconsultas_detalle?: any[];
  medicacion?:
    | { farmaco: string; dosis?: string; via?: string; frecuencia?: string }[]
    | any[];
  indicaciones_alta?: any[];
  recomendaciones?: any[];
  [k: string]: any;
} | null;

export type EPCEvent = {
  at: string;
  by?: string | null;
  action: string;
};

export type EPCContext = {
  epc: EPC;
  patient?: Patient | null;
  admission?: Admission | null;
  demographics?: { sexo?: string | null; edad?: number | null };
  hce?: { id: string; pages?: number; created_at?: string; structured?: any } | null;
  doctors: Doctor[];
  generated?: {
    at?: string;
    hce_source_id?: string | null;
    provider?: string | null;
    model?: string | null;
    data?: GeneratedData;
  } | null;
  clinical?: any;
  history?: EPCEvent[];
};

export type SectionKey =
  | "motivo"
  | "evolucion"
  | "estudios"
  | "procedimientos"
  | "interconsultas"
  | "tratamiento"
  | "indicaciones"
  | "recomendaciones";

export type SectionRating = "ok" | "partial" | "bad" | "hce_bad" | null;

export const SECTION_LABELS: Record<SectionKey, string> = {
  motivo: "Motivo de Internación",
  evolucion: "Evolución",
  estudios: "Estudios",
  procedimientos: "Procedimientos",
  interconsultas: "Interconsultas",
  tratamiento: "Plan Terapéutico",
  indicaciones: "Indicaciones de Alta",
  recomendaciones: "Recomendaciones al Alta",
};
