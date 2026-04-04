// src/pages/EPC/hooks/useEpcContext.ts
// Data loading and context assembly for EPC ViewEdit

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { isAxiosError } from "axios";
import type { EPC, EPCContext, EPCEvent, GeneratedData } from "@/types/epc";
import type { Patient, Admission, Doctor } from "@/types/patient";
import { isoToYmd, ymdToday, anyToYmd, arrToMultiline, arrToMultilineTitleCase } from "@/utils/format";

export type MedicacionItem = {
  tipo: "internacion" | "previa";
  farmaco: string;
  dosis?: string;
  via?: string;
  frecuencia?: string;
};

export interface EpcContextState {
  loading: boolean;
  errMsg: string | null;
  epc: EPC | null;
  patient: Patient | null;
  admission: Admission | null;
  demographics: { sexo?: string | null; edad?: number | null } | null;
  doctors: Doctor[];
  generated: EPCContext["generated"] | null;
  history: EPCEvent[];

  // Form fields
  titulo: string;
  cie10: string;
  fechaEmision: string;
  medicoId: string;
  medicoNombre: string;
  firmado: boolean;

  // Clinical fields
  admNum: string;
  protocolo: string;
  fecIng: string;
  fecEgr: string;
  sector: string;
  hab: string;
  cama: string;
  nroHC: string;

  // Generated content text fields
  motivoText: string;
  evolucionText: string;
  estudiosText: string;
  procedimientosText: string;
  interconsultasText: string;
  tratamientoText: string;
  indicacionesAltaText: string;
  recomendacionesText: string;
  laboratoriosData: string[];
  medicacionData: MedicacionItem[];

  // Setters for form fields
  setTitulo: (v: string) => void;
  setCie10: (v: string) => void;
  setFechaEmision: (v: string) => void;
  setMedicoId: (v: string) => void;
  setMedicoNombre: (v: string) => void;
  setFirmado: (v: boolean) => void;

  // Setters for clinical fields
  setAdmNum: (v: string) => void;
  setProtocolo: (v: string) => void;
  setFecIng: (v: string) => void;
  setFecEgr: (v: string) => void;
  setSector: (v: string) => void;
  setHab: (v: string) => void;
  setCama: (v: string) => void;
  setNroHC: (v: string) => void;

  // Setters for generated content
  setMotivoText: (v: string) => void;
  setEvolucionText: (v: string) => void;
  setEstudiosText: (v: string) => void;
  setProcedimientosText: (v: string) => void;
  setInterconsultasText: (v: string) => void;
  setTratamientoText: (v: string) => void;
  setIndicacionesAltaText: (v: string) => void;
  setRecomendacionesText: (v: string) => void;
  setLaboratoriosData: (v: string[]) => void;
  setMedicacionData: (v: MedicacionItem[]) => void;

  // Reload
  loadContext: (epcIdOrPatientId: string, opts?: { silent?: boolean }) => Promise<void>;

  // Editing flags reset callback
  resetEditingFlags: (() => void) | null;
  setResetEditingFlags: (fn: () => void) => void;
}

export function useEpcContext(id: string | undefined): EpcContextState {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [epc, setEpc] = useState<EPC | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [demographics, setDemographics] = useState<{
    sexo?: string | null;
    edad?: number | null;
  } | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [generated, setGenerated] = useState<EPCContext["generated"] | null>(null);
  const [history, setHistory] = useState<EPCEvent[]>([]);

  // Form
  const [titulo, setTitulo] = useState("");
  const [cie10, setCie10] = useState("");
  const [fechaEmision, setFechaEmision] = useState("");
  const [medicoId, setMedicoId] = useState("");
  const [medicoNombre, setMedicoNombre] = useState("");
  const [firmado, setFirmado] = useState(false);

  // Clinical
  const [admNum, setAdmNum] = useState("");
  const [protocolo, setProtocolo] = useState("");
  const [fecIng, setFecIng] = useState("");
  const [fecEgr, setFecEgr] = useState("");
  const [sector, setSector] = useState("");
  const [hab, setHab] = useState("");
  const [cama, setCama] = useState("");
  const [nroHC, setNroHC] = useState("");

  // Generated content
  const [motivoText, setMotivoText] = useState("");
  const [evolucionText, setEvolucionText] = useState("");
  const [estudiosText, setEstudiosText] = useState("");
  const [procedimientosText, setProcedimientosText] = useState("");
  const [interconsultasText, setInterconsultasText] = useState("");
  const [tratamientoText, setTratamientoText] = useState("");
  const [indicacionesAltaText, setIndicacionesAltaText] = useState("");
  const [recomendacionesText, setRecomendacionesText] = useState("");
  const [laboratoriosData, setLaboratoriosData] = useState<string[]>([]);
  const [medicacionData, setMedicacionData] = useState<MedicacionItem[]>([]);

  // Editing flags reset callback (set by the form hook)
  const [resetEditingFlags, setResetEditingFlagsState] = useState<(() => void) | null>(null);
  const setResetEditingFlags = (fn: () => void) => setResetEditingFlagsState(() => fn);

  const loadContext = async (epcIdOrPatientId: string, opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
    }
    setErrMsg(null);
    try {
      let epcData: EPC | null = null;
      try {
        const { data } = await api.get<EPC>(`/epc/${epcIdOrPatientId}`);
        epcData = data;
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 404) {
          const { data } = await api.post<EPC>(`/epc/open`, {
            patient_id: epcIdOrPatientId,
            admission_id: null,
          });
          epcData = data;
          navigate(`/epc/${data.id}`, { replace: true });
        } else {
          throw err;
        }
      }
      if (!epcData) throw new Error("EPC no encontrado/creado");

      let ctx: EPCContext | null = null;
      try {
        const { data } = await api.get<EPCContext>(`/epc/${epcData.id}/context`);
        ctx = data;
      } catch (ctxErr: any) {
        console.warn("[ViewEdit] Context fetch failed, using basic EPC data:", ctxErr?.response?.status);
        ctx = {
          epc: epcData,
          patient: undefined,
          admission: undefined,
          demographics: undefined,
          doctors: [],
          generated: (epcData as any).generated ?? null,
          history: [],
          hce: undefined,
        } as unknown as EPCContext;
      }

      setEpc(ctx.epc);
      setPatient(ctx.patient || null);
      setAdmission(ctx.admission || null);
      setDemographics(ctx.demographics || null);
      setDoctors(ctx.doctors || []);
      setGenerated(ctx.generated || null);
      setHistory(ctx.history || []);

      // Reset editing flags
      resetEditingFlags?.();

      // Clinical context
      const clinical: any = (ctx as any).clinical || {};
      const structured: any = ctx.hce?.structured || {};

      // Form defaults
      setTitulo((ctx.epc.titulo || "Epicrisis de internacion").trim());
      setCie10(
        (
          ctx.epc.diagnostico_principal_cie10 ||
          ctx.generated?.data?.diagnostico_principal_cie10 ||
          ""
        ).toString()
      );
      setFechaEmision(isoToYmd(ctx.epc.fecha_emision) || ymdToday());
      setFirmado(Boolean(ctx.epc.firmado_por_medico));

      const currentMedName = (ctx.epc.medico_responsable || "").trim();
      if (currentMedName) {
        setMedicoNombre(currentMedName);
        const found = (ctx.doctors || []).find((d) => d.full_name === currentMedName);
        setMedicoId(found?.id || "");
      } else {
        setMedicoNombre("");
        setMedicoId("");
      }

      // Clinical data with multiple sources
      const admiNumRaw =
        clinical.admision_num ??
        ctx.admission?.admision_num ??
        (ctx.epc as any).admision_num ??
        structured.admision_num ??
        structured.admision ??
        structured.numero_admision ??
        "";

      const protocoloRaw =
        clinical.protocolo ??
        ctx.admission?.protocolo ??
        (ctx.epc as any).protocolo ??
        structured.protocolo ??
        structured.protocolo_num ??
        "";

      const fechaIngRaw =
        clinical.fecha_ingreso ??
        ctx.admission?.fecha_ingreso ??
        (ctx.epc as any).fecha_ingreso ??
        structured.fecha_ingreso ??
        structured.fecha_admision ??
        "";

      const fechaEgrRaw =
        clinical.fecha_egreso ??
        ctx.admission?.fecha_egreso ??
        (ctx.epc as any).fecha_egreso ??
        structured.fecha_egreso ??
        structured.fecha_alta ??
        "";

      const sectorRaw =
        clinical.sector ??
        ctx.admission?.sector ??
        (ctx.epc as any).sector ??
        structured.sector ??
        structured.servicio ??
        structured.unidad ??
        "";

      const habRaw =
        clinical.habitacion ??
        ctx.admission?.habitacion ??
        (ctx.epc as any).habitacion ??
        structured.habitacion ??
        structured.hab ??
        "";

      const camaRaw =
        clinical.cama ??
        ctx.admission?.cama ??
        (ctx.epc as any).cama ??
        structured.cama ??
        structured.cama_num ??
        "";

      const nroHCRaw =
        clinical.numero_historia_clinica ??
        (ctx.epc as any).numero_historia_clinica ??
        structured.numero_historia_clinica ??
        structured.nro_hc ??
        structured.historia_clinica ??
        "";

      setAdmNum(admiNumRaw || "");
      setProtocolo(protocoloRaw || "");
      setFecIng(anyToYmd(fechaIngRaw) || "");
      setFecEgr(anyToYmd(fechaEgrRaw) || ymdToday());
      setSector(sectorRaw || "");
      setHab(habRaw || "");
      setCama(camaRaw || "");
      setNroHC(nroHCRaw || "");

      // Generated editable fields
      const rawGen: any = ctx.generated || null;
      const g: any =
        (rawGen && rawGen.data && typeof rawGen.data === "object" ? rawGen.data : rawGen) ||
        null;

      setMotivoText(g?.motivo_internacion || "");
      setEvolucionText(g?.evolucion || "");
      setEstudiosText(arrToMultilineTitleCase(g?.estudios));
      setProcedimientosText(arrToMultilineTitleCase(g?.procedimientos));
      setInterconsultasText(arrToMultiline(g?.interconsultas));
      setTratamientoText(arrToMultiline(g?.medicacion));

      setLaboratoriosData(Array.isArray(g?.laboratorios_detalle) ? g.laboratorios_detalle : []);

      // Structured medication data
      const medInternacion = Array.isArray(g?.medicacion_internacion) ? g.medicacion_internacion : [];
      const medPrevia = Array.isArray(g?.medicacion_previa) ? g.medicacion_previa : [];
      const medLegacy = Array.isArray(g?.medicacion) ? g.medicacion : [];

      if (medInternacion.length > 0 || medPrevia.length > 0) {
        const allMeds = [...medInternacion, ...medPrevia].filter((m: any) => m && m.farmaco);
        setMedicacionData(allMeds);
      } else if (medLegacy.length > 0) {
        setMedicacionData(medLegacy.filter((m: any) => m && m.farmaco));
      } else {
        setMedicacionData([]);
      }

      setIndicacionesAltaText(arrToMultiline(g?.indicaciones_alta));
      setRecomendacionesText(arrToMultiline(g?.recomendaciones));
    } catch (e: any) {
      setErrMsg(e?.response?.data?.detail || "No se pudo cargar la Epicrisis.");
    } finally {
      if (!opts?.silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!id || id === "undefined") return;
    loadContext(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return {
    loading,
    errMsg,
    epc,
    patient,
    admission,
    demographics,
    doctors,
    generated,
    history,

    titulo, setTitulo,
    cie10, setCie10,
    fechaEmision, setFechaEmision,
    medicoId, setMedicoId,
    medicoNombre, setMedicoNombre,
    firmado, setFirmado,

    admNum, setAdmNum,
    protocolo, setProtocolo,
    fecIng, setFecIng,
    fecEgr, setFecEgr,
    sector, setSector,
    hab, setHab,
    cama, setCama,
    nroHC, setNroHC,

    motivoText, setMotivoText,
    evolucionText, setEvolucionText,
    estudiosText, setEstudiosText,
    procedimientosText, setProcedimientosText,
    interconsultasText, setInterconsultasText,
    tratamientoText, setTratamientoText,
    indicacionesAltaText, setIndicacionesAltaText,
    recomendacionesText, setRecomendacionesText,
    laboratoriosData, setLaboratoriosData,
    medicacionData, setMedicacionData,

    loadContext,
    resetEditingFlags,
    setResetEditingFlags,
  };
}
