import React, { useEffect, useMemo, useState } from "react";
import "./ImportHceModal.css";
import api, {
    fetchAinsteinEpisodios,
    fetchAinsteinHistoria,
    AinsteinEpisodio,
    AinsteinHistoriaEntrada,
} from "../api/axios";
import { FaFileMedicalAlt, FaTimes, FaSearch, FaFileImport, FaSpinner } from "react-icons/fa";

function toDateInputValue(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

interface Props {
    onClose: () => void;
    onImportSuccess: () => void;
}

export const ImportHceModal: React.FC<Props> = ({ onClose, onImportSuccess }) => {
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
    const [colFilters, setColFilters] = useState({
        inteCodigo: "",
        paciCodigo: "",
        taltDescripcion: "",
        inteDiasEstada: ""
    });
    const [selected, setSelected] = useState<AinsteinEpisodio | null>(null);

    const [loadingHistoria, setLoadingHistoria] = useState(false);
    const [historia, setHistoria] = useState<AinsteinHistoriaEntrada[]>([]);

    const [importing, setImporting] = useState(false);

    // Sort & Pagination logic simplified
    // ...

    async function loadEpisodios() {
        setErrorEpisodios("");
        setLoadingEpisodios(true);
        setSelected(null);
        setHistoria([]);

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

    async function handleSelect(ep: AinsteinEpisodio) {
        setSelected(ep);
        setLoadingHistoria(true);
        try {
            const data = await fetchAinsteinHistoria(ep.inteCodigo, ep.paciCodigo);
            setHistoria(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setHistoria([]);
        } finally {
            setLoadingHistoria(false);
        }
    }

    async function importToMongoHce() {
        if (!selected) return;
        setImporting(true);
        try {
            const { data } = await api.post("/hce/import/ainstein", {
                episodio: selected,
                historia: historia,
                use_ai: false,
            });

            if (data?.ok) {
                onImportSuccess(); // Close and refresh
            }
        } catch (e: any) {
            alert("Error al importar: " + (e?.response?.data?.detail || e.message));
        } finally {
            setImporting(false);
        }
    }

    useEffect(() => {
        loadEpisodios();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Filter logic
    const filtered = useMemo(() => {
        return episodios.filter(e => {
            // Global Query
            const q = query.trim().toLowerCase();
            if (q) {
                const txt = [
                    e.inteCodigo,
                    e.paciCodigo,
                    e.inteFechaIngreso,
                    e.taltDescripcion,
                    e.paciEdad,
                    e.paciSexo,
                    e.inteDiasEstada
                ].join(" ").toLowerCase();
                if (!txt.includes(q)) return false;
            }

            // Column filters
            if (colFilters.inteCodigo && !String(e.inteCodigo).includes(colFilters.inteCodigo)) return false;
            if (colFilters.paciCodigo && !String(e.paciCodigo).includes(colFilters.paciCodigo)) return false;
            if (colFilters.inteDiasEstada && !String(e.inteDiasEstada ?? "").includes(colFilters.inteDiasEstada)) return false;
            if (colFilters.taltDescripcion && !String(e.taltDescripcion || "").toLowerCase().includes(colFilters.taltDescripcion.toLowerCase())) return false;

            return true;
        });
    }, [episodios, query, colFilters]);

    return (
        <div className="ihm-overlay">
            <div className="ihm-modal">
                <header className="ihm-header">
                    <div className="ihm-title">
                        <FaFileMedicalAlt /> Importar desde HCE
                    </div>
                    <button className="ihm-close" onClick={onClose}><FaTimes /></button>
                </header>

                <div className="ihm-body">
                    {/* Filtros */}
                    <div className="ihm-filters">
                        <div className="ihm-filters-row-1">
                            <div className="ihm-date-group">
                                <label className="ihm-date-label">Desde</label>
                                <input type="date" className="ihm-date-input" value={desde} onChange={e => setDesde(e.target.value)} />
                            </div>
                            <div className="ihm-date-group">
                                <label className="ihm-date-label">Hasta</label>
                                <input type="date" className="ihm-date-input" value={hasta} onChange={e => setHasta(e.target.value)} />
                            </div>
                            <button className="ihm-btn-search" onClick={loadEpisodios} disabled={loadingEpisodios}>
                                <FaSearch />
                            </button>
                        </div>
                        <div className="ihm-filters-row-2">
                            <input
                                className="ihm-search"
                                placeholder="Buscar paciente, código..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="ihm-split">
                        <div className="ihm-list">
                            {loadingEpisodios && (
                                <div className="ihm-progress-container">
                                    <div className="ihm-progress-active" />
                                </div>
                            )}
                            {errorEpisodios && <div className="ihm-error">{errorEpisodios}</div>}

                            <table className="ihm-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '90px' }}>Episodio</th>
                                        <th style={{ width: '150px' }}>Paciente</th>
                                        <th style={{ width: '130px' }}>Fechas (In/Out)</th>
                                        <th style={{ width: '60px' }}>Días</th>
                                        <th>Alta</th>
                                    </tr>
                                    <tr className="ihm-filter-row">
                                        <th>
                                            <input
                                                value={colFilters.inteCodigo}
                                                onChange={e => setColFilters(p => ({ ...p, inteCodigo: e.target.value }))}
                                                placeholder="#"
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                            <input
                                                value={colFilters.paciCodigo}
                                                onChange={e => setColFilters(p => ({ ...p, paciCodigo: e.target.value }))}
                                                placeholder="Código..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th></th>
                                        <th>
                                            <input
                                                value={colFilters.inteDiasEstada}
                                                onChange={e => setColFilters(p => ({ ...p, inteDiasEstada: e.target.value }))}
                                                placeholder="Días"
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                            <input
                                                value={colFilters.taltDescripcion}
                                                onChange={e => setColFilters(p => ({ ...p, taltDescripcion: e.target.value }))}
                                                placeholder="Alta/Est..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(ep => (
                                        <tr
                                            key={ep.inteCodigo}
                                            className={selected?.inteCodigo === ep.inteCodigo ? "is-selected" : ""}
                                            onClick={() => handleSelect(ep)}
                                        >
                                            <td className="mono">{ep.inteCodigo}</td>
                                            <td>
                                                <div className="ihm-paci-code">{ep.paciCodigo}</div>
                                                <div className="ihm-paci-meta">{ep.paciEdad} años - {ep.paciSexo}</div>
                                            </td>
                                            <td>
                                                <div className="ihm-date-stack">
                                                    <div className="ihm-date-in">IN: {ep.inteFechaIngreso ? new Date(ep.inteFechaIngreso).toLocaleDateString() : "-"}</div>
                                                    <div className="ihm-date-out">OT: {ep.inteFechaEgreso ? new Date(ep.inteFechaEgreso).toLocaleDateString() : "-"}</div>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: "center" }}>{ep.inteDiasEstada ?? "-"}</td>
                                            <td>{ep.taltDescripcion || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="ihm-details">
                            {selected ? (
                                <>
                                    <div className="ihm-sel-info">
                                        <h3>Episodio #{selected.inteCodigo}</h3>
                                        <p>Paciente: {selected.paciCodigo}</p>
                                        <p>Entradas en HC: {loadingHistoria ? "Cargando..." : historia.length}</p>
                                    </div>
                                    <div className="ihm-actions">
                                        <button
                                            className="ihm-btn-import"
                                            onClick={importToMongoHce}
                                            disabled={importing || loadingHistoria}
                                        >
                                            {importing ? <><FaSpinner className="spin" /> Importando...</> : <><FaFileImport /> Importar Paciente</>}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="ihm-empty-sel">Selecciona un episodio para ver detalles e importar.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
