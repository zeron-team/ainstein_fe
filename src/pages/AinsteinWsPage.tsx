// src/pages/AinsteinWsPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import "./AinsteinWsPage.css";
import api from "@/api/axios";
import {
    fetchAinsteinEpisodios,
    fetchAinsteinHistoria,
    AinsteinEpisodio,
    AinsteinHistoriaEntrada,
    AinsteinDiagnostico,
    AinsteinPlantillaGrupo,
    AinsteinPlantillaProp,
    AinsteinIndicacionFarm,
    AinsteinIndicacionProc,
    AinsteinIndicacionEnf,
} from "../api/axios";
import { FaFileMedicalAlt } from "react-icons/fa";

function toDateInputValue(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function safeText(v: any): string {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    try {
        return JSON.stringify(v);
    } catch {
        return String(v);
    }
}

// mini “strip” HTML (para evitar render inseguro)
function stripHtml(s: string): string {
    return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

const AinsteinWsPage: React.FC = () => {
    const today = useMemo(() => new Date(), []);
    const defaultDesde = useMemo(() => {
        const d = new Date(today);
        d.setDate(d.getDate() - 7);
        return toDateInputValue(d);
    }, [today]);

    const [desde, setDesde] = useState<string>(defaultDesde);
    const [hasta, setHasta] = useState<string>(toDateInputValue(today));

    const [loadingEpisodios, setLoadingEpisodios] = useState(false);
    const [episodios, setEpisodios] = useState<AinsteinEpisodio[]>([]);
    const [errorEpisodios, setErrorEpisodios] = useState<string>("");

    const [query, setQuery] = useState<string>("");

    const [selected, setSelected] = useState<AinsteinEpisodio | null>(null);

    const [loadingHistoria, setLoadingHistoria] = useState(false);
    const [historia, setHistoria] = useState<AinsteinHistoriaEntrada[]>([]);
    const [errorHistoria, setErrorHistoria] = useState<string>("");

    const [expandedEntr, setExpandedEntr] = useState<Record<number, boolean>>({});

    // ✅ Import a Mongo/HCE
    const [importing, setImporting] = useState(false);
    const [importOk, setImportOk] = useState<string>("");
    const [importError, setImportError] = useState<string>("");

    // ✅ Ordenamiento por columna
    type SortKey = "inteCodigo" | "paciCodigo" | "paciEdad" | "paciSexo" | "inteFechaIngreso" | "inteFechaEgreso" | "inteDiasEstada" | "taltDescripcion";
    const [sortConfig, setSortConfig] = useState<{
        key: SortKey | null;
        direction: "asc" | "desc";
    }>({ key: null, direction: "asc" });

    // ✅ Filtros por columna
    const [columnFilters, setColumnFilters] = useState<{
        inteCodigo: string;
        paciCodigo: string;
        paciEdad: string;
        paciSexo: string;
        inteFechaIngreso: string;
        inteFechaEgreso: string;
        inteDiasEstada: string;
        taltDescripcion: string;
    }>({
        inteCodigo: "",
        paciCodigo: "",
        paciEdad: "",
        paciSexo: "",
        inteFechaIngreso: "",
        inteFechaEgreso: "",
        inteDiasEstada: "",
        taltDescripcion: "",
    });

    // ✅ Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const PAGE_SIZE_OPTIONS = [20, 50, 100];

    // Handler para ordenar columnas
    function handleSort(key: SortKey) {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    }

    // Handler para actualizar filtro de columna
    function handleColumnFilter(key: keyof typeof columnFilters, value: string) {
        setColumnFilters((prev) => ({ ...prev, [key]: value }));
    }

    async function loadEpisodios() {
        setErrorEpisodios("");
        setLoadingEpisodios(true);
        setSelected(null);
        setHistoria([]);
        setErrorHistoria("");
        setExpandedEntr({});
        setImportOk("");
        setImportError("");

        try {
            const data = await fetchAinsteinEpisodios(desde, hasta);
            const arr = Array.isArray(data) ? data : [];
            setEpisodios(arr);
        } catch (e: any) {
            setErrorEpisodios(e?.message || "Error obteniendo episodios");
            setEpisodios([]);
        } finally {
            setLoadingEpisodios(false);
        }
    }

    async function loadHistoria(ep: AinsteinEpisodio) {
        setErrorHistoria("");
        setLoadingHistoria(true);
        setHistoria([]);
        setExpandedEntr({});
        setImportOk("");
        setImportError("");

        try {
            const data = await fetchAinsteinHistoria(ep.inteCodigo, ep.paciCodigo);
            const arr = Array.isArray(data) ? data : [];
            setHistoria(arr);
        } catch (e: any) {
            setErrorHistoria(e?.message || "Error obteniendo historia clínica");
            setHistoria([]);
        } finally {
            setLoadingHistoria(false);
        }
    }

    async function importToMongoHce() {
        if (!selected) return;

        setImportOk("");
        setImportError("");
        setImporting(true);

        try {
            const { data } = await api.post("/hce/import/ainstein", {
                episodio: selected,
                historia: historia,
                // opcional:
                // patient_id: `AINSTEIN_${selected.paciCodigo}`,
                use_ai: false,
            });

            if (data?.ok) {
                setImportOk(
                    `HCE incorporada en Mongo. Estado: internación. hce_id=${data.hce_id} • patient_id=${data.patient_id}`
                );
            } else {
                setImportError("No se pudo incorporar la HCE (respuesta no OK).");
            }
        } catch (e: any) {
            const msg =
                e?.response?.data?.detail ||
                e?.response?.data?.message ||
                e?.message ||
                "Error incorporando HCE a Mongo";
            setImportError(String(msg));
        } finally {
            setImporting(false);
        }
    }

    useEffect(() => {
        // carga inicial automática
        loadEpisodios();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const episodiosFiltrados = useMemo(() => {
        let result = [...episodios];

        // 1) Filtro global (búsqueda general)
        const q = query.trim().toLowerCase();
        if (q) {
            result = result.filter((e) => {
                const blob = [
                    e.inteCodigo,
                    e.paciCodigo,
                    e.paciEdad,
                    e.paciSexo,
                    e.taltDescripcion,
                    e.inteFechaIngreso,
                    e.inteFechaEgreso,
                ]
                    .map((x) => (x === null || x === undefined ? "" : String(x)))
                    .join(" ")
                    .toLowerCase();

                return blob.includes(q);
            });
        }

        // 2) Filtros por columna
        if (columnFilters.inteCodigo) {
            result = result.filter((e) =>
                String(e.inteCodigo ?? "").toLowerCase().includes(columnFilters.inteCodigo.toLowerCase())
            );
        }
        if (columnFilters.paciCodigo) {
            result = result.filter((e) =>
                String(e.paciCodigo ?? "").toLowerCase().includes(columnFilters.paciCodigo.toLowerCase())
            );
        }
        if (columnFilters.paciEdad) {
            result = result.filter((e) =>
                String(e.paciEdad ?? "").toLowerCase().includes(columnFilters.paciEdad.toLowerCase())
            );
        }
        if (columnFilters.paciSexo) {
            result = result.filter((e) =>
                String(e.paciSexo ?? "").toLowerCase().includes(columnFilters.paciSexo.toLowerCase())
            );
        }
        if (columnFilters.inteFechaIngreso) {
            result = result.filter((e) =>
                String(e.inteFechaIngreso ?? "").toLowerCase().includes(columnFilters.inteFechaIngreso.toLowerCase())
            );
        }
        if (columnFilters.inteFechaEgreso) {
            result = result.filter((e) =>
                String(e.inteFechaEgreso ?? "").toLowerCase().includes(columnFilters.inteFechaEgreso.toLowerCase())
            );
        }
        if (columnFilters.inteDiasEstada) {
            result = result.filter((e) =>
                String(e.inteDiasEstada ?? "").toLowerCase().includes(columnFilters.inteDiasEstada.toLowerCase())
            );
        }
        if (columnFilters.taltDescripcion) {
            result = result.filter((e) =>
                String(e.taltDescripcion ?? "").toLowerCase().includes(columnFilters.taltDescripcion.toLowerCase())
            );
        }

        // 3) Ordenamiento
        if (sortConfig.key) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key!] ?? "";
                const bVal = b[sortConfig.key!] ?? "";
                const comparison = String(aVal).localeCompare(String(bVal), "es", { numeric: true });
                return sortConfig.direction === "asc" ? comparison : -comparison;
            });
        }

        return result;
    }, [episodios, query, columnFilters, sortConfig]);

    // ✅ Reset página cuando cambian filtros
    useMemo(() => {
        setCurrentPage(1);
    }, [query, columnFilters]);

    // ✅ Cálculo de paginación
    const totalItems = episodiosFiltrados.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEpisodios = episodiosFiltrados.slice(startIndex, endIndex);

    const canImport = !!selected && !loadingHistoria && !errorHistoria && historia.length > 0;

    return (
        <div className="aw-wrap">
            <div className="aw-head">
                <div className="aw-head-left">
                    <div className="aw-head-icon">
                        <FaFileMedicalAlt />
                    </div>
                    <div>
                        <h1 className="aw-title">Historias Clínicas Electrónicas</h1>
                        <p className="aw-sub">
                            Consultá episodios por fecha y seleccioná uno para cargar su historia clínica
                        </p>
                    </div>
                </div>
            </div>

            <div className="aw-grid">
                {/* Panel izquierdo: Episodios */}
                <section className="aw-card">
                    <div className="aw-card-title">Episodios</div>

                    <div className="aw-filters">
                        <label className="aw-field">
                            <span>Desde</span>
                            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
                        </label>

                        <label className="aw-field">
                            <span>Hasta</span>
                            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                        </label>

                        <button className="aw-btn" onClick={loadEpisodios} disabled={loadingEpisodios}>
                            {loadingEpisodios ? "Consultando..." : "Buscar"}
                        </button>

                        <label className="aw-field aw-field-grow">
                            <span>Filtro</span>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="inteCodigo, paciCodigo, sexo, alta..."
                            />
                        </label>
                    </div>

                    {errorEpisodios ? <div className="aw-error">{errorEpisodios}</div> : null}

                    <div className="aw-table-wrap">
                        <table className="aw-table">
                            <thead>
                                <tr>
                                    <th className="sortable" onClick={() => handleSort("inteCodigo")}>
                                        inteCodigo {sortConfig.key === "inteCodigo" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                                    </th>
                                    <th className="sortable" onClick={() => handleSort("paciCodigo")}>
                                        paciCodigo {sortConfig.key === "paciCodigo" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                                    </th>
                                    <th className="sortable" onClick={() => handleSort("paciEdad")}>
                                        Edad {sortConfig.key === "paciEdad" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                                    </th>
                                    <th className="sortable" onClick={() => handleSort("paciSexo")}>
                                        Sexo {sortConfig.key === "paciSexo" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                                    </th>
                                    <th className="sortable" onClick={() => handleSort("inteFechaIngreso")}>
                                        Ingreso {sortConfig.key === "inteFechaIngreso" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                                    </th>
                                    <th className="sortable" onClick={() => handleSort("inteFechaEgreso")}>
                                        Egreso {sortConfig.key === "inteFechaEgreso" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                                    </th>
                                    <th className="sortable" onClick={() => handleSort("inteDiasEstada")}>
                                        Días {sortConfig.key === "inteDiasEstada" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                                    </th>
                                    <th className="sortable" onClick={() => handleSort("taltDescripcion")}>
                                        Alta {sortConfig.key === "taltDescripcion" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                                    </th>
                                    <th>Mov.</th>
                                </tr>
                                <tr className="filter-row">
                                    <th>
                                        <input
                                            type="text"
                                            className="column-filter"
                                            placeholder="Buscar..."
                                            value={columnFilters.inteCodigo}
                                            onChange={(e) => handleColumnFilter("inteCodigo", e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </th>
                                    <th>
                                        <input
                                            type="text"
                                            className="column-filter"
                                            placeholder="Buscar..."
                                            value={columnFilters.paciCodigo}
                                            onChange={(e) => handleColumnFilter("paciCodigo", e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </th>
                                    <th>
                                        <input
                                            type="text"
                                            className="column-filter"
                                            placeholder="Buscar..."
                                            value={columnFilters.paciEdad}
                                            onChange={(e) => handleColumnFilter("paciEdad", e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </th>
                                    <th>
                                        <input
                                            type="text"
                                            className="column-filter"
                                            placeholder="Buscar..."
                                            value={columnFilters.paciSexo}
                                            onChange={(e) => handleColumnFilter("paciSexo", e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </th>
                                    <th>
                                        <input
                                            type="text"
                                            className="column-filter"
                                            placeholder="Buscar..."
                                            value={columnFilters.inteFechaIngreso}
                                            onChange={(e) => handleColumnFilter("inteFechaIngreso", e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </th>
                                    <th>
                                        <input
                                            type="text"
                                            className="column-filter"
                                            placeholder="Buscar..."
                                            value={columnFilters.inteFechaEgreso}
                                            onChange={(e) => handleColumnFilter("inteFechaEgreso", e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </th>
                                    <th>
                                        <input
                                            type="text"
                                            className="column-filter"
                                            placeholder="Buscar..."
                                            value={columnFilters.inteDiasEstada}
                                            onChange={(e) => handleColumnFilter("inteDiasEstada", e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </th>
                                    <th>
                                        <input
                                            type="text"
                                            className="column-filter"
                                            placeholder="Buscar..."
                                            value={columnFilters.taltDescripcion}
                                            onChange={(e) => handleColumnFilter("taltDescripcion", e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedEpisodios.map((e) => {
                                    const isSel =
                                        selected?.inteCodigo === e.inteCodigo && selected?.paciCodigo === e.paciCodigo;

                                    return (
                                        <tr
                                            key={`${e.inteCodigo}-${e.paciCodigo}`}
                                            className={isSel ? "is-selected" : ""}
                                            onClick={() => {
                                                setSelected(e);
                                                loadHistoria(e);
                                            }}
                                            title="Click para traer historia clínica"
                                        >
                                            <td className="mono">{e.inteCodigo}</td>
                                            <td className="mono">{e.paciCodigo}</td>
                                            <td>{e.paciEdad ?? "-"}</td>
                                            <td>
                                                <span className="aw-badge">{e.paciSexo ?? "-"}</span>
                                            </td>
                                            <td className="mono">{e.inteFechaIngreso ? e.inteFechaIngreso.replace("T", " ") : "-"}</td>
                                            <td className="mono">{e.inteFechaEgreso ? e.inteFechaEgreso.replace("T", " ") : "-"}</td>
                                            <td>{e.inteDiasEstada ?? "-"}</td>
                                            <td>{e.taltDescripcion ?? "-"}</td>
                                            <td>{e.movimientos?.length ?? 0}</td>
                                        </tr>
                                    );
                                })}

                                {!loadingEpisodios && episodiosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="aw-empty">
                                            Sin resultados para el rango seleccionado.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>

                    {/* ✅ Controles de Paginación */}
                    {totalItems > 0 && (
                        <div className="aw-pagination">
                            <div className="aw-pagination-info">
                                Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} episodios
                            </div>

                            <div className="aw-pagination-controls">
                                <button
                                    className="aw-page-btn"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    ««
                                </button>
                                <button
                                    className="aw-page-btn"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    «
                                </button>

                                <span className="aw-page-num">
                                    Página {currentPage} de {totalPages}
                                </span>

                                <button
                                    className="aw-page-btn"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    »
                                </button>
                                <button
                                    className="aw-page-btn"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    »»
                                </button>
                            </div>

                            <div className="aw-page-size">
                                <span>Por página:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    {PAGE_SIZE_OPTIONS.map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {selected?.movimientos?.length ? (
                        <div className="aw-subcard">
                            <div className="aw-subcard-title">
                                Movimientos del episodio <span className="mono">#{selected.inteCodigo}</span> (paci{" "}
                                <span className="mono">{selected.paciCodigo}</span>)
                            </div>

                            <div className="aw-movs">
                                {selected.movimientos.map((m) => (
                                    <div key={m.inmoCodigo} className="aw-mov">
                                        <div className="aw-mov-top">
                                            <span className="mono">inmo {m.inmoCodigo}</span>
                                            <span className="mono">{m.inmoFechaDesde?.replace("T", " ")}</span>
                                        </div>
                                        <div className="aw-mov-mid">
                                            <span className="aw-pill">{m.salaDescripcion || "—"}</span>
                                            <span className="aw-pill">{m.nicuDescripcion || "—"}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </section>

                {/* Panel derecho: Historia */}
                <section className="aw-card">
                    <div className="aw-card-title">Historia clínica</div>

                    {!selected ? (
                        <div className="aw-hint">Seleccioná un episodio de la tabla para cargar la historia clínica.</div>
                    ) : (
                        <div className="aw-selected">
                            <div className="aw-selected-line">
                                Episodio: <b className="mono">{selected.inteCodigo}</b> • Paciente:{" "}
                                <b className="mono">{selected.paciCodigo}</b>
                            </div>
                            <div className="aw-selected-line small">
                                Ingreso: <span className="mono">{(selected.inteFechaIngreso || "-").replace("T", " ")}</span> • Egreso:{" "}
                                <span className="mono">{(selected.inteFechaEgreso || "-").replace("T", " ")}</span>
                            </div>

                            {/* ✅ Botón de importación a Mongo/HCE */}
                            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <button className="aw-btn" onClick={importToMongoHce} disabled={!canImport || importing}>
                                    {importing ? "Incorporando..." : "Incorporar a Pacientes (Internación)"}
                                </button>
                            </div>

                            {importOk ? <div className="aw-ok" style={{ marginTop: 10 }}>{importOk}</div> : null}
                            {importError ? <div className="aw-error" style={{ marginTop: 10 }}>{importError}</div> : null}
                        </div>
                    )}

                    {loadingHistoria ? <div className="aw-loading">Cargando historia clínica...</div> : null}
                    {errorHistoria ? <div className="aw-error">{errorHistoria}</div> : null}

                    {!loadingHistoria && selected && historia.length === 0 && !errorHistoria ? (
                        <div className="aw-emptybox">No hay entradas de historia clínica para este episodio/paciente.</div>
                    ) : null}

                    <div className="aw-accordion">
                        {historia.map((h) => {
                            const open = !!expandedEntr[h.entrCodigo];
                            const title = h.entrTipoRegistro || "Registro";
                            const when = h.entrFechaAtencion ? h.entrFechaAtencion.replace("T", " ") : "-";

                            const dx = (h.diagnosticos || [])
                                .map((d) => (d as AinsteinDiagnostico)?.diagDescripcion)
                                .filter(Boolean)
                                .slice(0, 4);

                            return (
                                <div key={h.entrCodigo} className="aw-acc-item">
                                    <button
                                        className="aw-acc-head"
                                        onClick={() =>
                                            setExpandedEntr((p) => ({ ...p, [h.entrCodigo]: !p[h.entrCodigo] }))
                                        }
                                    >
                                        <div className="aw-acc-left">
                                            <div className="aw-acc-title">
                                                <span className="aw-badge strong">{title}</span>
                                                <span className="mono aw-acc-code">#{h.entrCodigo}</span>
                                            </div>

                                            <div className="aw-acc-meta">
                                                <span className="mono">{when}</span>

                                                {dx.length ? (
                                                    <span className="aw-dx">
                                                        {dx.map((x, i) => (
                                                            <span key={i} className="aw-pill">
                                                                {x}
                                                            </span>
                                                        ))}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="aw-acc-right">{open ? "▾" : "▸"}</div>
                                    </button>

                                    {open ? (
                                        <div className="aw-acc-body">
                                            {h.entrMotivoConsulta ? (
                                                <div className="aw-block">
                                                    <div className="aw-block-title">Motivo</div>
                                                    <div className="aw-text">{safeText(h.entrMotivoConsulta)}</div>
                                                </div>
                                            ) : null}

                                            {h.entrEvolucion ? (
                                                <div className="aw-block">
                                                    <div className="aw-block-title">Evolución</div>
                                                    <div className="aw-text">{safeText(h.entrEvolucion)}</div>
                                                </div>
                                            ) : null}

                                            {h.entrPlan ? (
                                                <div className="aw-block">
                                                    <div className="aw-block-title">Plan</div>
                                                    <div className="aw-text">{safeText(h.entrPlan)}</div>
                                                </div>
                                            ) : null}

                                            {Array.isArray(h.indicacionFarmacologica) && h.indicacionFarmacologica.length ? (
                                                <div className="aw-block">
                                                    <div className="aw-block-title">Indicaciones farmacológicas</div>
                                                    <div className="aw-list">
                                                        {h.indicacionFarmacologica.map((m: AinsteinIndicacionFarm, idx: number) => (
                                                            <div className="aw-list-item" key={`${m.enmeCodigo ?? idx}-${idx}`}>
                                                                <div className="aw-list-item-top">
                                                                    <b>{m.geneDescripcion || "Medicamento"}</b>
                                                                    <span className="mono">
                                                                        {m.enmeDosis ? `${m.enmeDosis} ${m.tumeDescripcion || ""}`.trim() : ""}
                                                                    </span>
                                                                </div>

                                                                <div className="aw-list-item-sub">
                                                                    {m.mefrDescripcion ? <span className="aw-pill">{m.mefrDescripcion}</span> : null}
                                                                    {m.meviDescripcion ? <span className="aw-pill">{m.meviDescripcion}</span> : null}
                                                                </div>

                                                                {m.aplicaciones?.length ? (
                                                                    <div className="aw-mini">
                                                                        {m.aplicaciones.slice(0, 10).map((a, j) => (
                                                                            <div key={j} className="aw-mini-row">
                                                                                <span className="mono">{(a.panoFechaAtencion || "").replace("T", " ")}</span>
                                                                                <span>{a.nomeDescripcion}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {Array.isArray(h.indicacionProcedimientos) && h.indicacionProcedimientos.length ? (
                                                <div className="aw-block">
                                                    <div className="aw-block-title">Procedimientos</div>
                                                    <div className="aw-list">
                                                        {h.indicacionProcedimientos.map((p: AinsteinIndicacionProc, idx: number) => (
                                                            <div className="aw-list-item" key={`${p.enprCodigo ?? idx}-${idx}`}>
                                                                <div className="aw-list-item-top">
                                                                    <b>{p.procDescripcion || "Procedimiento"}</b>
                                                                    {p.enprCodigo ? <span className="mono">#{p.enprCodigo}</span> : null}
                                                                </div>
                                                                {p.enprObservacion ? (
                                                                    <div className="aw-text small">{safeText(p.enprObservacion)}</div>
                                                                ) : null}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {Array.isArray(h.indicacionEnfermeria) && h.indicacionEnfermeria.length ? (
                                                <div className="aw-block">
                                                    <div className="aw-block-title">Enfermería</div>
                                                    <div className="aw-list">
                                                        {h.indicacionEnfermeria.map((p: AinsteinIndicacionEnf, idx: number) => (
                                                            <div className="aw-list-item" key={`${p.eninCodigo ?? idx}-${idx}`}>
                                                                <div className="aw-list-item-top">
                                                                    <b>{p.indiDescripcion || "Indicacion"}</b>
                                                                    {p.eninCodigo ? <span className="mono">#{p.eninCodigo}</span> : null}
                                                                </div>
                                                                {p.eninObservacion ? (
                                                                    <div className="aw-text small">{safeText(p.eninObservacion)}</div>
                                                                ) : null}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {Array.isArray(h.plantillas) && h.plantillas.length ? (
                                                <div className="aw-block">
                                                    <div className="aw-block-title">Plantillas</div>

                                                    {h.plantillas.map((g: AinsteinPlantillaGrupo, gi: number) => (
                                                        <div key={gi} className="aw-template">
                                                            <div className="aw-template-title">{g.grupDescripcion || "Grupo"}</div>

                                                            <div className="aw-template-body">
                                                                {(g.propiedades || []).map((pr: AinsteinPlantillaProp, pi: number) => {
                                                                    const label = pr.grprDescripcion || `Campo ${pi + 1}`;
                                                                    const val = pr.engpValor;

                                                                    const opciones = (pr.opciones || [])
                                                                        .map((o) => o?.grpoDescripcion)
                                                                        .filter(Boolean);

                                                                    return (
                                                                        <div key={pi} className="aw-kv">
                                                                            <div className="aw-k">{label}</div>

                                                                            <div className="aw-v">
                                                                                {opciones.length ? (
                                                                                    <div className="aw-pills">
                                                                                        {opciones.map((x, k) => (
                                                                                            <span className="aw-pill" key={k}>
                                                                                                {x}
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                ) : null}

                                                                                {val !== undefined && val !== null ? (
                                                                                    <div className="aw-text small">
                                                                                        {typeof val === "string" ? stripHtml(val) : safeText(val)}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="aw-muted">—</div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AinsteinWsPage;