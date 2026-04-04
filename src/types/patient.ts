// src/types/patient.ts
// Shared patient-related types

export type Patient = {
  id: string;
  apellido?: string | null;
  nombre?: string | null;
  dni?: string | null;
  cuil?: string | null;
  obra_social?: string | null;
  nro_beneficiario?: string | null;
  fecha_nacimiento?: string | null;
  sexo?: string | null;
};

export type Admission = {
  id: string;
  sector?: string | null;
  habitacion?: string | null;
  cama?: string | null;
  fecha_ingreso?: string | null;
  fecha_egreso?: string | null;
  protocolo?: string | null;
  admision_num?: string | null;
};

export type Doctor = {
  id: string;
  full_name: string;
  username: string;
};
