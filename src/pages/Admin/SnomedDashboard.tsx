// src/pages/Admin/SnomedDashboard.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaStethoscope, FaUserMd, FaMicroscope, FaProcedures, FaSearch, FaBrain, FaCut, FaHeartbeat, FaNotesMedical } from "react-icons/fa";
import api from "@/api/axios";
import "./SnomedDashboard.css";

/* ---------- Types ---------- */
type Tab = "interconsultas" | "estudios" | "procedimientos" | "especialidades" | "hallazgos" | "trastornos" | "procedimientos-generales";

type Interconsulta = { snomed_id: string; interconsulta: string };
type Estudio = { snomed_id: string; estudio: string; tipo_estudio: string };
type Procedimiento = { snomed_id: string; procedimiento: string };
type Especialidad = { snomed_id: string; especialidad: string };
type Hallazgo = { snomed_id: string; hallazgo: string };
type Trastorno = { snomed_id: string; trastorno: string };

type SortConfig = { key: string; dir: "asc" | "desc" };

/* ---------- Tab config ---------- */
const TAB_CONFIG: Record<Tab, { label: string; shortLabel: string; icon: React.ReactNode; desc: string; colorVar: string }> = {
    interconsultas: { label: "Interconsultas", shortLabel: "Interconsultas", icon: <FaUserMd />, desc: "Consultas con especialistas", colorVar: "indigo" },
    estudios: { label: "Estudios", shortLabel: "Estudios", icon: <FaMicroscope />, desc: "Imágenes + Laboratorio", colorVar: "emerald" },
    procedimientos: { label: "Proc. Clínicos", shortLabel: "Proc. Clínicos", icon: <FaProcedures />, desc: "Procedimientos clínicos", colorVar: "orange" },
    especialidades: { label: "Especialidades", shortLabel: "Especialidades", icon: <FaStethoscope />, desc: "Especialidades médicas", colorVar: "sky" },
    hallazgos: { label: "Hallazgos", shortLabel: "Hallazgos", icon: <FaHeartbeat />, desc: "Hallazgos clínicos", colorVar: "purple" },
    trastornos: { label: "Trastornos", shortLabel: "Trastornos", icon: <FaBrain />, desc: "Diagnósticos / Trastornos", colorVar: "rose" },
    "procedimientos-generales": { label: "Proc. Generales", shortLabel: "Proc. Grales.", icon: <FaCut />, desc: "Procedimientos generales y quirúrgicos", colorVar: "amber" },
};

const ALL_TABS: Tab[] = ["interconsultas", "estudios", "procedimientos", "especialidades", "hallazgos", "trastornos", "procedimientos-generales"];

/* ---------- Helpers ---------- */
function useDebouncedValue(value: string, delay = 350) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

function sortArray<T>(data: T[], sort: SortConfig): T[] {
    if (!sort.key) return data;
    const sorted = [...data];
    sorted.sort((a, b) => {
        const va = (a as any)[sort.key] || "";
        const vb = (b as any)[sort.key] || "";
        return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return sorted;
}

/* ---------- Component ---------- */
export default function SnomedDashboard() {
    const [tab, setTab] = useState<Tab>("interconsultas");
    const [search, setSearch] = useState("");
    const [tipoEstudio, setTipoEstudio] = useState("");
    const [sort, setSort] = useState<SortConfig>({ key: "", dir: "asc" });

    const [interconsultas, setInterconsultas] = useState<Interconsulta[]>([]);
    const [estudios, setEstudios] = useState<Estudio[]>([]);
    const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([]);
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [hallazgos, setHallazgos] = useState<Hallazgo[]>([]);
    const [trastornos, setTrastornos] = useState<Trastorno[]>([]);
    const [procGenerales, setProcGenerales] = useState<Procedimiento[]>([]);

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [counts, setCounts] = useState<Record<Tab, number>>({
        interconsultas: 0, estudios: 0, procedimientos: 0,
        especialidades: 0, hallazgos: 0, trastornos: 0, "procedimientos-generales": 0
    });

    const debouncedSearch = useDebouncedValue(search);

    const totalTerms = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);

    /* Fetch counts on mount */
    useEffect(() => {
        setInitialLoading(true);
        Promise.all([
            api.get("/snomed/interconsultas"),
            api.get("/snomed/estudios"),
            api.get("/snomed/procedimientos"),
            api.get("/snomed/especialidades"),
            api.get("/snomed/hallazgos"),
            api.get("/snomed/trastornos"),
            api.get("/snomed/procedimientos-generales"),
        ]).then(([r1, r2, r3, r4, r5, r6, r7]) => {
            setCounts({
                interconsultas: r1.data.length,
                estudios: r2.data.length,
                procedimientos: r3.data.length,
                especialidades: r4.data.length,
                hallazgos: r5.data.length,
                trastornos: r6.data.length,
                "procedimientos-generales": r7.data.length,
            });
            setInterconsultas(r1.data);
            setEstudios(r2.data);
            setProcedimientos(r3.data);
            setEspecialidades(r4.data);
            setHallazgos(r5.data);
            setTrastornos(r6.data);
            setProcGenerales(r7.data);
        }).catch(err => console.error("Error loading SNOMED data:", err))
            .finally(() => setInitialLoading(false));
    }, []);

    /* Fetch on tab/search change */
    useEffect(() => {
        if (initialLoading) return;
        setLoading(true);
        const params: Record<string, string> = {};
        if (debouncedSearch) params.q = debouncedSearch;
        if (tab === "estudios" && tipoEstudio) params.tipo = tipoEstudio;

        const endpoint = `/snomed/${tab}`;
        api
            .get(endpoint, { params })
            .then((r) => {
                switch (tab) {
                    case "interconsultas": setInterconsultas(r.data); break;
                    case "estudios": setEstudios(r.data); break;
                    case "procedimientos": setProcedimientos(r.data); break;
                    case "especialidades": setEspecialidades(r.data); break;
                    case "hallazgos": setHallazgos(r.data); break;
                    case "trastornos": setTrastornos(r.data); break;
                    case "procedimientos-generales": setProcGenerales(r.data); break;
                }
            })
            .finally(() => setLoading(false));
    }, [tab, debouncedSearch, tipoEstudio, initialLoading]);

    /* Sorting */
    const handleSort = useCallback(
        (key: string) => {
            setSort((prev) =>
                prev.key === key
                    ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                    : { key, dir: "asc" }
            );
        },
        []
    );

    const renderSortArrow = (key: string) => {
        const isActive = sort.key === key;
        const arrow = isActive ? (sort.dir === "asc" ? "▲" : "▼") : "↕";
        return (
            <span className={`sort-arrow ${isActive ? "sort-arrow--active" : ""}`}>
                {arrow}
            </span>
        );
    };

    /* Get current data sorted */
    const getCurrentData = (): any[] => {
        switch (tab) {
            case "interconsultas": return sortArray(interconsultas, sort);
            case "estudios": return sortArray(estudios, sort);
            case "procedimientos": return sortArray(procedimientos, sort);
            case "especialidades": return sortArray(especialidades, sort);
            case "hallazgos": return sortArray(hallazgos, sort);
            case "trastornos": return sortArray(trastornos, sort);
            case "procedimientos-generales": return sortArray(procGenerales, sort);
            default: return [];
        }
    };

    const currentData = getCurrentData();
    const currentCount = currentData.length;

    /* Get the field name for the main column */
    const getMainField = (): string => {
        switch (tab) {
            case "interconsultas": return "interconsulta";
            case "estudios": return "estudio";
            case "procedimientos": return "procedimiento";
            case "especialidades": return "especialidad";
            case "hallazgos": return "hallazgo";
            case "trastornos": return "trastorno";
            case "procedimientos-generales": return "procedimiento";
            default: return "";
        }
    };

    const mainField = getMainField();
    const tabConfig = TAB_CONFIG[tab];

    /* ---------- Render ---------- */
    return (
        <div className="snomed-wrap">
            {/* Header */}
            <div className="snomed-header">
                <div className="snomed-header-left">
                    <div className="snomed-header-icon">
                        <FaStethoscope />
                    </div>
                    <div>
                        <h1>SNOMED CT Argentina</h1>
                        <div className="snomed-subtitle">
                            Terminología clínica estandarizada — Extensión Argentina Nov 2025
                        </div>
                    </div>
                </div>
                <div className="snomed-total-pill">
                    <FaNotesMedical />
                    <span className="snomed-total-number">{totalTerms.toLocaleString()}</span>
                    <span className="snomed-total-label">términos</span>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="snomed-kpi-grid">
                {ALL_TABS.map((t) => {
                    const cfg = TAB_CONFIG[t];
                    const isActive = tab === t;
                    return (
                        <button
                            key={t}
                            className={`snomed-kpi-card snomed-kpi--${cfg.colorVar} ${isActive ? "snomed-kpi--active" : ""}`}
                            onClick={() => { setTab(t); setSearch(""); setTipoEstudio(""); setSort({ key: "", dir: "asc" }); }}
                        >
                            <div className="snomed-kpi-icon">
                                {cfg.icon}
                            </div>
                            <div className="snomed-kpi-value">
                                {counts[t].toLocaleString()}
                            </div>
                            <div className="snomed-kpi-label">
                                {cfg.shortLabel}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Active category description */}
            <div className="snomed-active-banner">
                <span className={`snomed-active-dot snomed-dot--${tabConfig.colorVar}`}></span>
                <span className="snomed-active-title">{tabConfig.label}</span>
                <span className="snomed-active-sep">—</span>
                <span className="snomed-active-desc">{tabConfig.desc}</span>
            </div>

            {/* Search bar */}
            <div className="snomed-toolbar">
                <div className="snomed-search-wrap">
                    <FaSearch className="snomed-search-icon" />
                    <input
                        type="text"
                        className="snomed-search"
                        placeholder={`Buscar ${tabConfig.label.toLowerCase()}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {tab === "estudios" && (
                    <select
                        className="snomed-filter-select"
                        value={tipoEstudio}
                        onChange={(e) => setTipoEstudio(e.target.value)}
                    >
                        <option value="">Todos los tipos</option>
                        <option value="Diagnóstico por imágenes">Diagnóstico por imágenes</option>
                        <option value="Laboratorio">Laboratorio</option>
                    </select>
                )}

                <span className="snomed-result-count">
                    {currentCount.toLocaleString()} resultado{currentCount !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Table */}
            <div className="snomed-table-wrap">
                {(loading || initialLoading) ? (
                    <div className="snomed-loading">
                        <div className="snomed-loading-spinner"></div>
                        <span>Cargando datos SNOMED…</span>
                    </div>
                ) : currentCount === 0 ? (
                    <div className="snomed-empty">
                        <FaSearch style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }} />
                        <br />
                        No se encontraron resultados
                    </div>
                ) : (
                    <div className="snomed-table-scroll">
                        {/* ===== ESTUDIOS (special: has tipo_estudio column) ===== */}
                        {tab === "estudios" ? (
                            <table className="snomed-table" id="snomed-table-estudios">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort("snomed_id")} style={{ width: 160 }}>
                                            SNOMED ID {renderSortArrow("snomed_id")}
                                        </th>
                                        <th onClick={() => handleSort("estudio")}>
                                            Estudio {renderSortArrow("estudio")}
                                        </th>
                                        <th onClick={() => handleSort("tipo_estudio")} style={{ width: 220 }}>
                                            Tipo {renderSortArrow("tipo_estudio")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(currentData as Estudio[]).map((row) => (
                                        <tr key={row.snomed_id + row.estudio}>
                                            <td className="snomed-id-cell">{row.snomed_id}</td>
                                            <td>{row.estudio}</td>
                                            <td>
                                                <span
                                                    className={`snomed-tipo-badge ${row.tipo_estudio === "Diagnóstico por imágenes"
                                                        ? "snomed-tipo-badge--imagenes"
                                                        : "snomed-tipo-badge--laboratorio"
                                                        }`}
                                                >
                                                    {row.tipo_estudio}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            /* ===== Generic 2-column table for all other tabs ===== */
                            <table className="snomed-table" id={`snomed-table-${tab}`}>
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort("snomed_id")} style={{ width: 160 }}>
                                            SNOMED ID {renderSortArrow("snomed_id")}
                                        </th>
                                        <th onClick={() => handleSort(mainField)}>
                                            {tabConfig.label} {renderSortArrow(mainField)}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentData.map((row: any) => (
                                        <tr key={row.snomed_id + (row[mainField] || "")}>
                                            <td className="snomed-id-cell">{row.snomed_id}</td>
                                            <td>{row[mainField]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
