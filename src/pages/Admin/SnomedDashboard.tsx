// src/pages/Admin/SnomedDashboard.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaStethoscope, FaUserMd, FaMicroscope, FaProcedures, FaSearch } from "react-icons/fa";
import api from "@/api/axios";
import "./SnomedDashboard.css";

/* ---------- Types ---------- */
type Tab = "interconsultas" | "estudios" | "procedimientos";

type Interconsulta = { snomed_id: string; interconsulta: string };
type Estudio = { snomed_id: string; estudio: string; tipo_estudio: string };
type Procedimiento = { snomed_id: string; procedimiento: string };

type SortConfig = { key: string; dir: "asc" | "desc" };

/* ---------- Helpers ---------- */
function useDebouncedValue(value: string, delay = 350) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
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

    const [loading, setLoading] = useState(false);
    const [counts, setCounts] = useState({ inter: 0, est: 0, proc: 0 });

    const debouncedSearch = useDebouncedValue(search);

    /* Fetch counts on mount */
    useEffect(() => {
        Promise.all([
            api.get("/snomed/interconsultas"),
            api.get("/snomed/estudios"),
            api.get("/snomed/procedimientos"),
        ]).then(([r1, r2, r3]) => {
            setCounts({
                inter: r1.data.length,
                est: r2.data.length,
                proc: r3.data.length,
            });
            setInterconsultas(r1.data);
            setEstudios(r2.data);
            setProcedimientos(r3.data);
        });
    }, []);

    /* Fetch on tab/search change */
    useEffect(() => {
        setLoading(true);
        const params: Record<string, string> = {};
        if (debouncedSearch) params.q = debouncedSearch;
        if (tab === "estudios" && tipoEstudio) params.tipo = tipoEstudio;

        const endpoint = `/snomed/${tab}`;
        api
            .get(endpoint, { params })
            .then((r) => {
                if (tab === "interconsultas") setInterconsultas(r.data);
                else if (tab === "estudios") setEstudios(r.data);
                else setProcedimientos(r.data);
            })
            .finally(() => setLoading(false));
    }, [tab, debouncedSearch, tipoEstudio]);

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

    /* Sort data */
    const sortedInterconsultas = useMemo(() => {
        const data = [...interconsultas];
        if (sort.key) {
            data.sort((a, b) => {
                const va = (a as any)[sort.key] || "";
                const vb = (b as any)[sort.key] || "";
                return sort.dir === "asc"
                    ? va.localeCompare(vb)
                    : vb.localeCompare(va);
            });
        }
        return data;
    }, [interconsultas, sort]);

    const sortedEstudios = useMemo(() => {
        const data = [...estudios];
        if (sort.key) {
            data.sort((a, b) => {
                const va = (a as any)[sort.key] || "";
                const vb = (b as any)[sort.key] || "";
                return sort.dir === "asc"
                    ? va.localeCompare(vb)
                    : vb.localeCompare(va);
            });
        }
        return data;
    }, [estudios, sort]);

    const sortedProcedimientos = useMemo(() => {
        const data = [...procedimientos];
        if (sort.key) {
            data.sort((a, b) => {
                const va = (a as any)[sort.key] || "";
                const vb = (b as any)[sort.key] || "";
                return sort.dir === "asc"
                    ? va.localeCompare(vb)
                    : vb.localeCompare(va);
            });
        }
        return data;
    }, [procedimientos, sort]);

    const currentCount =
        tab === "interconsultas"
            ? sortedInterconsultas.length
            : tab === "estudios"
                ? sortedEstudios.length
                : sortedProcedimientos.length;

    /* ---------- Render ---------- */
    return (
        <div className="snomed-wrap">
            {/* Header */}
            <div className="snomed-header">
                <div>
                    <h1>
                        <FaStethoscope /> SNOMED CT Argentina
                    </h1>
                    <div className="snomed-subtitle">
                        Terminología clínica estandarizada — Extensión Argentina Nov 2025
                    </div>
                </div>
            </div>

            {/* Summary cards (act as tabs) */}
            <div className="snomed-summary-grid">
                <div
                    className={`snomed-summary-card ${tab === "interconsultas" ? "snomed-summary-card--active" : ""}`}
                    onClick={() => { setTab("interconsultas"); setSearch(""); setSort({ key: "", dir: "asc" }); }}
                >
                    <div className="snomed-card-icon snomed-card-icon--interconsultas">
                        <FaUserMd />
                    </div>
                    <div className="snomed-card-info">
                        <strong>Interconsultas</strong>
                        <span>Consultas con especialistas</span>
                    </div>
                    <div className="snomed-card-count">{counts.inter}</div>
                </div>

                <div
                    className={`snomed-summary-card ${tab === "estudios" ? "snomed-summary-card--active" : ""}`}
                    onClick={() => { setTab("estudios"); setSearch(""); setTipoEstudio(""); setSort({ key: "", dir: "asc" }); }}
                >
                    <div className="snomed-card-icon snomed-card-icon--estudios">
                        <FaMicroscope />
                    </div>
                    <div className="snomed-card-info">
                        <strong>Estudios</strong>
                        <span>Imágenes + Laboratorio</span>
                    </div>
                    <div className="snomed-card-count">{counts.est}</div>
                </div>

                <div
                    className={`snomed-summary-card ${tab === "procedimientos" ? "snomed-summary-card--active" : ""}`}
                    onClick={() => { setTab("procedimientos"); setSearch(""); setSort({ key: "", dir: "asc" }); }}
                >
                    <div className="snomed-card-icon snomed-card-icon--procedimientos">
                        <FaProcedures />
                    </div>
                    <div className="snomed-card-info">
                        <strong>Procedimientos</strong>
                        <span>Procedimientos clínicos</span>
                    </div>
                    <div className="snomed-card-count">{counts.proc}</div>
                </div>
            </div>

            {/* Search bar */}
            <div className="snomed-toolbar">
                <input
                    type="text"
                    className="snomed-search"
                    placeholder={`🔍 Buscar ${tab === "interconsultas" ? "interconsultas" : tab === "estudios" ? "estudios" : "procedimientos"}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

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
                    {currentCount} resultado{currentCount !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Table */}
            <div className="snomed-table-wrap">
                {loading ? (
                    <div className="snomed-loading">
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
                        {/* ===== INTERCONSULTAS ===== */}
                        {tab === "interconsultas" && (
                            <table className="snomed-table" id="snomed-table-interconsultas">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort("snomed_id")} style={{ width: 160 }}>
                                            SNOMED ID {renderSortArrow("snomed_id")}
                                        </th>
                                        <th onClick={() => handleSort("interconsulta")}>
                                            Interconsulta {renderSortArrow("interconsulta")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedInterconsultas.map((row) => (
                                        <tr key={row.snomed_id}>
                                            <td className="snomed-id-cell">{row.snomed_id}</td>
                                            <td>{row.interconsulta}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* ===== ESTUDIOS ===== */}
                        {tab === "estudios" && (
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
                                    {sortedEstudios.map((row) => (
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
                        )}

                        {/* ===== PROCEDIMIENTOS ===== */}
                        {tab === "procedimientos" && (
                            <table className="snomed-table" id="snomed-table-procedimientos">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort("snomed_id")} style={{ width: 160 }}>
                                            SNOMED ID {renderSortArrow("snomed_id")}
                                        </th>
                                        <th onClick={() => handleSort("procedimiento")}>
                                            Procedimiento {renderSortArrow("procedimiento")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedProcedimientos.map((row) => (
                                        <tr key={row.snomed_id}>
                                            <td className="snomed-id-cell">{row.snomed_id}</td>
                                            <td>{row.procedimiento}</td>
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
