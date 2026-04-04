// src/pages/Patients/types.ts
// Local types used only by the Patients list feature

export type PacienteItem = {
  id: string;
  apellido: string;
  nombre: string;
  dni?: string | null;
  hce_numero?: string | null;
  movimiento_id?: string | null;
  sector?: string | null;
  habitacion?: string | null;
  cama?: string | null;
  obra_social?: string | null;
  nro_beneficiario?: string | null;
  estado?: "internacion" | "falta_epc" | "epc_generada" | "alta" | null;
  fecha_ingreso?: string | null;
  fecha_egreso?: string | null;
  edad?: number | null;
  sexo?: string | null;
  dias_estada?: number | null;
  tipo_alta?: string | null;
  epc_created_by_name?: string | null;
  epc_created_at?: string | null;
};

export type ListResponse = {
  items: PacienteItem[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
};

export type AinsteinDiagnostico = {
  diagDescripcion?: string | null;
};

export type AinsteinIndicacionFarmacologicaAplicacion = {
  panoFechaAtencion?: string | null;
  nomeDescripcion?: string | null;
};

export type AinsteinMedicacionAsociada = {
  enmeCodigo?: number | null;
  geneDescripcion?: string | null;
  enmeDosis?: any;
  tumeDescripcion?: string | null;
};

export type AinsteinIndicacionFarmacologica = {
  enmeCodigo?: number | null;
  geneDescripcion?: string | null;
  enmeVelocidad?: any;
  enmeDosis?: any;
  tumeDescripcion?: string | null;
  mefrDescripcion?: string | null;
  meviDescripcion?: string | null;
  meesDescripcion?: string | null;
  meprDescripcion?: string | null;
  medicacionAsociada?: AinsteinMedicacionAsociada[] | null;
  aplicaciones?: AinsteinIndicacionFarmacologicaAplicacion[] | null;
};

export type AinsteinIndicacionProcedimiento = {
  enprCodigo?: number | null;
  procDescripcion?: string | null;
  enprObservacion?: string | null;
};

export type AinsteinIndicacionEnfermeria = {
  eninCodigo?: number | null;
  indiDescripcion?: string | null;
  eninObservacion?: string | null;
};

export type AinsteinPlantillaOpcion = {
  grpoDescripcion?: string | null;
};

export type AinsteinPlantillaPropiedad = {
  engpCodigo?: number | null;
  grprDescripcion?: string | null;
  engpValor?: any;
  opciones?: AinsteinPlantillaOpcion[] | null;
};

export type AinsteinPlantilla = {
  grupDescripcion?: string | null;
  propiedades?: AinsteinPlantillaPropiedad[] | null;
};

export type AinsteinHistoriaEntrada = {
  entrCodigo: number;
  entrTipoRegistro?: string | null;
  entrFechaAtencion?: string | null;
  entrMotivoConsulta?: any;
  entrEvolucion?: any;
  entrPlan?: any;
  diagnosticos?: AinsteinDiagnostico[] | null;
  indicacionFarmacologica?: AinsteinIndicacionFarmacologica[] | null;
  indicacionProcedimientos?: AinsteinIndicacionProcedimiento[] | null;
  indicacionEnfermeria?: AinsteinIndicacionEnfermeria[] | null;
  plantillas?: AinsteinPlantilla[] | null;
};

export type AinsteinMovimiento = {
  inmoCodigo?: number | null;
  inmoFechaDesde?: string | null;
  salaDescripcion?: string | null;
  nicuDescripcion?: string | null;
};

export type AinsteinEpisodio = {
  inteCodigo?: number | null;
  paciCodigo?: number | null;
  paciEdad?: number | null;
  paciSexo?: string | null;
  inteFechaIngreso?: string | null;
  inteFechaEgreso?: string | null;
  inteDiasEstada?: number | null;
  taltDescripcion?: string | null;
  movimientos?: AinsteinMovimiento[] | null;
};

export type HceDoc = {
  _id: string;
  patient_id: string;
  admission_id?: string | null;
  text?: string | null;
  pages?: number | null;
  structured?: Record<string, any> | null;
  ai_generated?: Record<string, any> | null;
  source?: Record<string, any> | null;
  ainstein?: {
    episodio?: AinsteinEpisodio | Record<string, any> | null;
    historia?: AinsteinHistoriaEntrada[] | any;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SortField = "apellido" | "nombre" | "epc_created_at";
export type SortDirection = "asc" | "desc";

export const ESTADOS = [
  { key: "internacion", label: "Internación" },
  { key: "falta_epc", label: "Falta EPC" },
  { key: "epc_generada", label: "EPC generada" },
  { key: "alta", label: "Alta" },
];

export const PAGE_SIZE_OPTIONS = [20, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;
