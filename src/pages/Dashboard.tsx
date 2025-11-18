import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/axios";
import KPI from "@/components/KPI";
import "./dashboard.css";
import {
  FaUsers,
  FaBed,
  FaClock,
  FaFileSignature,
  FaCheckCircle,
  FaCalendarDay,
  FaCalendarAlt,
} from "react-icons/fa";

type Kpis = {
  total_pacientes: number;
  pacientes_por_estado: {
    internacion: number;
    falta_epc: number;
    epc_generada: number;
    alta: number;
    [k: string]: number;
  };
  epc_hoy: number;
  epc_mtd: number;
};

const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

const Dashboard: React.FC = () => {
  const [data, setData] = useState<Kpis | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await api.get("/kpis");
        if (!mounted) return;
        setData(res.data);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.response?.data?.detail ?? e.message ?? "Error al cargar KPIs");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => {
      mounted = false;
    };
  }, []);

  const st = data?.pacientes_por_estado ?? {
    internacion: 0,
    falta_epc: 0,
    epc_generada: 0,
    alta: 0,
  };
  const total = data?.total_pacientes ?? 0;

  const derivadas = useMemo(() => {
    const internacion = st.internacion || 0;
    const falta = st.falta_epc || 0;
    const generada = st.epc_generada || 0;
    const alta = st.alta || 0;
    return {
      internacion,
      falta,
      generada,
      alta,
      ocupacionPct: pct(internacion, total),
      completitudPct: pct(generada, total),
      pendientesPct: pct(falta, total),
    };
  }, [st.internacion, st.falta_epc, st.epc_generada, st.alta, total]);

  const segments = useMemo(() => {
    const items = [
      { key: "internacion", label: "Internación", value: derivadas.internacion, tone: "seg-pri" },
      { key: "falta_epc", label: "Falta EPC", value: derivadas.falta, tone: "seg-war" },
      { key: "epc_generada", label: "EPC generada", value: derivadas.generada, tone: "seg-suc" },
      { key: "alta", label: "Alta", value: derivadas.alta, tone: "seg-neu" },
    ];
    const sum = items.reduce((a, b) => a + b.value, 0) || 1;
    return items.map((it) => ({ ...it, pct: (it.value / sum) * 100 }));
  }, [derivadas.internacion, derivadas.falta, derivadas.generada, derivadas.alta]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await api.get("/kpis");
      setData(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? e.message ?? "Error al actualizar KPIs");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="dash">
      {/* Header del dashboard */}
      <header className="dashboard-header">
        <div className="dashboard-header-main">
          <h1>Dashboard clínico</h1>
          <p className="dashboard-subtitle">
            Visión ejecutiva de internaciones, Epicrisis y altas en tiempo real.
          </p>
          <div className="dashboard-meta">
            <span className="meta-pill">
              <span className="meta-dot" /> Actualizado al {formattedDate}
            </span>
            {typeof total === "number" && (
              <span className="meta-pill meta-pill-soft">
                Cohorte actual: <strong>{total}</strong> paciente(s)
              </span>
            )}
          </div>
        </div>

        <div className="dashboard-header-actions">
          <button
            className="dash-btn dash-btn-primary"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Actualizando…" : "Actualizar datos"}
          </button>
        </div>
      </header>

      {err && (
        <div className="dashboard-alert dashboard-alert--error">
          {err}
        </div>
      )}

      {/* KPIs principales */}
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Indicadores clave</h2>
          <span className="section-subtitle">
            Estado general de la internación y gestión de Epicrisis.
          </span>
        </div>

        <div className="kpi-grid">
          <KPI
            label="Pacientes totales"
            value={total ?? "—"}
            icon={<FaUsers />}
            subtitle="Pacientes activos en el sistema."
            variant="primary"
            trend="flat"
          />

          <KPI
            label="Internación"
            value={derivadas.internacion}
            icon={<FaBed />}
            subtitle={`${derivadas.ocupacionPct.toFixed(1)}% de ocupación`}
            variant="warning"
            trend="flat"
            trendLabel={`${derivadas.internacion} en cama`}
          />

          <KPI
            label="Falta EPC"
            value={derivadas.falta}
            icon={<FaClock />}
            subtitle={`${derivadas.pendientesPct.toFixed(1)}% de la cohorte`}
            variant="neutral"
            trend={derivadas.falta > 0 ? "down" : "flat"}
            trendLabel={
              derivadas.falta > 0
                ? "Objetivo: reducir pendientes"
                : "Sin pendientes"
            }
          />

          <KPI
            label="EPC generadas"
            value={derivadas.generada}
            icon={<FaFileSignature />}
            subtitle={`${derivadas.completitudPct.toFixed(1)}% de completitud`}
            variant="success"
            trend="up"
            trendLabel={`${derivadas.generada} con Epicrisis`}
          />

          <KPI
            label="Altas"
            value={derivadas.alta}
            icon={<FaCheckCircle />}
            subtitle="Pacientes con alta definitiva."
            variant="primary"
            trend="flat"
          />

          <KPI
            label="EPC hoy"
            value={data?.epc_hoy ?? "—"}
            icon={<FaCalendarDay />}
            subtitle="Epicrisis emitidas en el día."
            variant="success"
            trend={data && data.epc_hoy > 0 ? "up" : "flat"}
            trendLabel={
              data ? `${data.epc_hoy} hoy` : undefined
            }
          />

          <KPI
            label="EPC mes en curso"
            value={data?.epc_mtd ?? "—"}
            icon={<FaCalendarAlt />}
            subtitle="Epicrisis generadas este mes."
            variant="primary"
            trend="up"
            trendLabel={
              data ? `${data.epc_mtd} en el mes` : undefined
            }
          />
        </div>
      </section>

      {/* Distribución + accesos rápidos */}
      <section className="dashboard-section dashboard-two-col">
        {/* Distribución por estado */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Distribución por estado</h3>
            <span className="dashboard-card-subtitle">
              Proporción relativa de la cohorte actual.
            </span>
          </div>

          <div className="segbar">
            {segments.map((s) => (
              <div
                key={s.key}
                className={`seg ${s.tone}`}
                style={{ width: `${s.pct}%` }}
                title={`${s.label}: ${s.value} paciente(s)`}
              />
            ))}
          </div>

          <div className="seg-legend">
            {segments.map((s) => (
              <div key={s.key} className="seg-legend__item">
                <span className={`dot ${s.tone}`} />
                <span className="name">{s.label}</span>
                <span className="val">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Accesos rápidos</h3>
            <span className="dashboard-card-subtitle">
              Navegá directo a las cohortes clínicas clave.
            </span>
          </div>

          <div className="quick-grid">
            <Link to="/patients?estado=internacion" className="quick quick--pri">
              <div className="quick-icon">
                <FaBed />
              </div>
              <div className="quick-body">
                <span className="quick-title">Pacientes en internación</span>
                <span className="quick-subtitle">
                  Gestioná camas, estancia y evolución.
                </span>
              </div>
            </Link>

            <Link to="/patients?estado=falta_epc" className="quick quick--war">
              <div className="quick-icon">
                <FaClock />
              </div>
              <div className="quick-body">
                <span className="quick-title">Pendientes de Epicrisis</span>
                <span className="quick-subtitle">
                  Priorizá generación de Epicrisis con IA.
                </span>
              </div>
            </Link>

            <Link to="/patients?estado=epc_generada" className="quick quick--suc">
              <div className="quick-icon">
                <FaFileSignature />
              </div>
              <div className="quick-body">
                <span className="quick-title">Epicrisis generadas</span>
                <span className="quick-subtitle">
                  Revisá, imprimí y exportá Epicrisis.
                </span>
              </div>
            </Link>

            <Link to="/patients?estado=alta" className="quick quick--neu">
              <div className="quick-icon">
                <FaCheckCircle />
              </div>
              <div className="quick-body">
                <span className="quick-title">Pacientes de alta</span>
                <span className="quick-subtitle">
                  Seguimiento post alta y auditoría.
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;