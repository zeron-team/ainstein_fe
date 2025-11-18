// frontend/src/pages/Settings/Branding.tsx
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import api from "@/api/axios";
import { FaSave, FaUndo, FaImage, FaCheckCircle, FaTimes } from "react-icons/fa";

type BrandingForm = {
  hospital_nombre: string;
  logo_url: string;
  header_linea1: string;
  header_linea2: string;
  footer_linea1: string;
  footer_linea2: string;
};

const EMPTY: BrandingForm = {
  hospital_nombre: "",
  logo_url: "",
  header_linea1: "",
  header_linea2: "",
  footer_linea1: "",
  footer_linea2: "",
};

const STYLE_ID = "branding-styles";

// fuerza strings -> evita uncontrolled->controlled
function sanitize(input: any): BrandingForm {
  const src = input ?? {};
  return {
    hospital_nombre: typeof src.hospital_nombre === "string" ? src.hospital_nombre : "",
    logo_url: typeof src.logo_url === "string" ? src.logo_url : "",
    header_linea1: typeof src.header_linea1 === "string" ? src.header_linea1 : "",
    header_linea2: typeof src.header_linea2 === "string" ? src.header_linea2 : "",
    footer_linea1: typeof src.footer_linea1 === "string" ? src.footer_linea1 : "",
    footer_linea2: typeof src.footer_linea2 === "string" ? src.footer_linea2 : "",
  };
}

export default function Branding() {
  const [form, setForm] = useState<BrandingForm>(EMPTY);
  const initialRef = useRef<BrandingForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msgOk, setMsgOk] = useState<string | null>(null);
  const [msgErr, setMsgErr] = useState<string | null>(null);
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement("style");
      s.id = STYLE_ID;
      s.innerHTML = `
      .brand-page { padding: 20px; color: #e6ecf7; }
      .brand-grid { display:grid; gap:16px; grid-template-columns: 1fr; }
      @media (min-width: 980px) { .brand-grid { grid-template-columns: 1.1fr 1fr; } }
      .card { border: 1px solid rgba(255,255,255,.08); background: rgba(8,15,30,.6); border-radius: 16px; padding: 18px; }
      .title { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
      .form { display:grid; gap:12px; }
      .field { display:flex; flex-direction:column; gap:6px; }
      .label { font-size: 12px; color:#9db1cf; }
      .input { width:100%; background: rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);
               color:#eaf1ff; border-radius:10px; padding:10px 12px; font-size:14px; }
      .row { display:grid; gap:12px; grid-template-columns: 1fr; }
      @media (min-width: 720px) { .row { grid-template-columns: 1fr 1fr; } }
      .toolbar { display:flex; gap:10px; flex-wrap:wrap; margin-top: 4px; }
      .btn { display:inline-flex; align-items:center; gap:8px; border:1px solid rgba(255,255,255,.12);
             background: rgba(255,255,255,.03); color:#eaf3ff; padding:10px 14px; border-radius:12px; cursor:pointer; }
      .btn:hover { filter: brightness(1.1); transform: translateY(-1px); transition: all .15s ease; }
      .btn.primary { background: linear-gradient(135deg, #2a5fff, #3fb2ff); border-color: rgba(80,180,255,.5); }
      .btn:disabled { opacity:.6; cursor:not-allowed; transform:none !important; }
      .toast { margin-top: 8px; font-size: 13px; }
      .toast.ok { color:#8ff0b8; }
      .toast.err { color:#ff9c9c; }
      .preview-card { border: 1px dashed rgba(255,255,255,.18); background: rgba(255,255,255,.03);
                      border-radius: 16px; padding: 12px; }
      .paper { background:#0c1429; border:1px solid rgba(255,255,255,.06); border-radius:12px; padding: 16px 18px; }
      .paper-header, .paper-footer { display:flex; align-items:center; gap:12px; justify-content:space-between; }
      .paper-header { border-bottom:1px solid rgba(255,255,255,.08); padding-bottom:10px; margin-bottom:12px; }
      .paper-footer { border-top:1px solid rgba(255,255,255,.08); padding-top:10px; margin-top:12px; color:#a9b7d6; }
      .paper-lines { display:flex; flex-direction:column; gap:3px; }
      .hospital { font-weight:800; letter-spacing:.2px; }
      .logo { width:56px; height:56px; border-radius:10px; object-fit:contain; background: rgba(255,255,255,.06);
              border: 1px solid rgba(255,255,255,.12); }
      .logo.placeholder { display:flex; align-items:center; justify-content:center; color:#9db1cf; font-size:11px; }
      .paper-body { color:#a9b7d6; font-size: 13px; line-height: 1.35; }
      .dim { opacity:.8 }
      `;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get("/config/branding")
      .then((r) => {
        if (!mounted) return;
        const data = sanitize(r.data);
        setForm(data);
        initialRef.current = data;
      })
      .catch(() => {
        if (mounted) setMsgErr("No se pudo cargar el branding.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  function set<K extends keyof BrandingForm>(k: K, v: BrandingForm[K]) {
    // v siempre string -> inputs 100% controlados
    setForm((f) => ({ ...f, [k]: v }));
  }

  const changed = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialRef.current),
    [form]
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsgOk(null);
    setMsgErr(null);
    try {
      await api.put("/config/branding", form);
      initialRef.current = form;
      setMsgOk("Guardado correctamente.");
      setTimeout(() => setMsgOk(null), 1600);
    } catch (err: any) {
      setMsgErr(err?.response?.data?.detail ?? "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    setForm(initialRef.current);
    setMsgOk(null);
    setMsgErr(null);
  }

  if (loading) return <div className="brand-page">Cargando branding…</div>;

  const { hospital_nombre, logo_url, header_linea1, header_linea2, footer_linea1, footer_linea2 } = form;

  return (
    <div className="brand-page">
      <div className="brand-grid">
        <form className="card" onSubmit={onSubmit}>
          <div className="title">Branding (Header/Footer EPC)</div>

          <div className="form">
            <div className="field">
              <label className="label">Nombre del Hospital</label>
              <input
                className="input"
                placeholder="Hospital General San Martín"
                value={hospital_nombre}
                onChange={(e) => set("hospital_nombre", e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Logo URL</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                <input
                  className="input"
                  placeholder="https://…/logo.png"
                  value={logo_url}
                  onChange={(e) => { setLogoOk(true); set("logo_url", e.target.value); }}
                />
                <span
                  title={logoOk ? "Vista previa OK" : "No se pudo cargar la imagen"}
                  style={{ alignSelf: "center", color: logoOk ? "#8ff0b8" : "#ff9c9c", fontSize: 12 }}
                >
                  <FaImage /> {logoOk ? "OK" : "Error"}
                </span>
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label className="label">Header línea 1</label>
                <input
                  className="input"
                  placeholder="Dirección, teléfono, email…"
                  value={header_linea1}
                  onChange={(e) => set("header_linea1", e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">Header línea 2</label>
                <input
                  className="input"
                  placeholder="CUIT, razón social, guardia 24 hs…"
                  value={header_linea2}
                  onChange={(e) => set("header_linea2", e.target.value)}
                />
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label className="label">Footer línea 1</label>
                <input
                  className="input"
                  placeholder="Aviso legal, confidencialidad…"
                  value={footer_linea1}
                  onChange={(e) => set("footer_linea1", e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">Footer línea 2</label>
                <input
                  className="input"
                  placeholder="© Hospital — Todos los derechos reservados"
                  value={footer_linea2}
                  onChange={(e) => set("footer_linea2", e.target.value)}
                />
              </div>
            </div>

            <div className="toolbar">
              <button className="btn primary" type="submit" disabled={saving || !changed}>
                <FaSave /> {saving ? "Guardando…" : "Guardar"}
              </button>
              <button className="btn" type="button" onClick={onReset} disabled={!changed || saving}>
                <FaUndo /> Restablecer
              </button>
            </div>

            {msgOk && (
              <div className="toast ok">
                <FaCheckCircle style={{ marginRight: 6 }} />
                {msgOk}
              </div>
            )}
            {msgErr && (
              <div className="toast err">
                <FaTimes style={{ marginRight: 6 }} />
                {msgErr}
              </div>
            )}
          </div>
        </form>

        <div className="card preview-card">
          <div className="title">Vista previa</div>
          <div className="paper">
            <div className="paper-header">
              {logo_url.trim() ? (
                <img
                  src={logo_url}
                  className={`logo ${logoOk ? "" : "placeholder"}`}
                  onError={() => setLogoOk(false)}
                  onLoad={() => setLogoOk(true)}
                  alt="logo"
                />
              ) : (
                <div className="logo placeholder">Sin logo</div>
              )}
              <div className="paper-lines" style={{ flex: 1 }}>
                <div className="hospital">{hospital_nombre || "Hospital / Institución"}</div>
                <div className="dim">{header_linea1 || "Dirección / Teléfono / Email"}</div>
                <div className="dim">{header_linea2 || "Datos complementarios del encabezado"}</div>
              </div>
            </div>

            <div className="paper-body">
              <b>Epicrisis</b> — Bloque ilustrativo para dimensionar encabezado y pie.
            </div>

            <div className="paper-footer">
              <div className="paper-lines">
                <div>{footer_linea1 || "Aviso legal / Política de privacidad"}</div>
                <div>{footer_linea2 || "© Institución — Todos los derechos reservados"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}