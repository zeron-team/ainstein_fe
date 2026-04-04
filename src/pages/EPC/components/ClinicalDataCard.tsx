// src/pages/EPC/components/ClinicalDataCard.tsx
// Clinical data display card (admission numbers, dates, sector, etc.)

interface ClinicalDataCardProps {
  nroHC: string;
  setNroHC: (v: string) => void;
  admNum: string;
  setAdmNum: (v: string) => void;
  protocolo: string;
  setProtocolo: (v: string) => void;
  fecIng: string;
  setFecIng: (v: string) => void;
  fecEgr: string;
  setFecEgr: (v: string) => void;
  sector: string;
  setSector: (v: string) => void;
  hab: string;
  setHab: (v: string) => void;
  cama: string;
  setCama: (v: string) => void;
}

export default function ClinicalDataCard({
  nroHC, setNroHC,
  admNum, setAdmNum,
  protocolo, setProtocolo,
  fecIng, setFecIng,
  fecEgr, setFecEgr,
  sector, setSector,
  hab, setHab,
  cama, setCama,
}: ClinicalDataCardProps) {
  return (
    <div className="card card-clinical">
      <div className="section-header">
        <h3>Datos clinicos</h3>
      </div>
      <div className="grid2" style={{ marginTop: 10 }}>
        <div className="field">
          <label className="label">N&deg; Historia Clinica</label>
          <input
            className="input"
            placeholder="ej. 123456"
            value={nroHC}
            onChange={(e) => setNroHC(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label">N&deg; Admision</label>
          <input
            className="input"
            placeholder="ej. 653476-1"
            value={admNum}
            onChange={(e) => setAdmNum(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label">Protocolo</label>
          <input
            className="input"
            placeholder="ej. 6534761-001"
            value={protocolo}
            onChange={(e) => setProtocolo(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label">Fecha de ingreso</label>
          <input
            type="date"
            className="date"
            value={fecIng}
            onChange={(e) => setFecIng(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label">Fecha de egreso</label>
          <input
            type="date"
            className="date"
            value={fecEgr}
            onChange={(e) => setFecEgr(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label">Sector</label>
          <input
            className="input"
            placeholder="EMERGENCIAS - INTERNACION"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label">Hab.</label>
          <input
            className="input"
            placeholder="033"
            value={hab}
            onChange={(e) => setHab(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label">Cama</label>
          <input
            className="input"
            placeholder="01"
            value={cama}
            onChange={(e) => setCama(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
