export type PatientEstado = 'internacion' | 'falta_epc' | 'epc_generada' | 'alta';

export interface PatientRow {
  id: string;
  apellido: string;
  nombre: string;
  dni?: string;
  obra_social?: string;
  nro_beneficiario?: string;
  estado?: PatientEstado | null;
}

export interface PatientsListResponse {
  items: PatientRow[];
  total: number;
  by_estado: Record<PatientEstado, number>;
}