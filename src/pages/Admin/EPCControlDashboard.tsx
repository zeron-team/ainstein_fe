// src/pages/Admin/EPCControlDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import api from "@/api/axios";
import {
    FaChartBar,
    FaUserMd,
    FaFileMedical,
    FaThumbsUp,
    FaThumbsDown,
    FaMeh,
    FaExclamationCircle,
    FaCheckCircle,
    FaSearch,
    FaSortUp,
    FaSortDown,
    FaSort,
    FaClipboardList,
    FaSyncAlt,
    FaPercentage,
    FaClock,
    FaDownload,
    FaFileExcel,
    FaFilePdf,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "./EPCControlDashboard.css";

// Section labels
const SECTION_LABELS: Record<string, string> = {
    motivo_internacion: "Motivo",
    evolucion: "Evolución",
    procedimientos: "Proc.",
    interconsultas: "Interc.",
    medicacion: "Tratam.",
    indicaciones_alta: "Ind. alta",
    recomendaciones: "Recom.",
};

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function timeAgo(iso: string | null): string {
    if (!iso) return "";
    const now = new Date();
    const then = new Date(iso);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return "hace segundos";
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
}

type KPIs = {
    total_epcs: number;
    total_evaluations: number;
    total_evaluators: number;
    avg_evaluations_per_user: number;
    epcs_without_evaluation: number;
    approval_rate_pct: number;
};

type UserRow = {
    user_id: string;
    user_name: string;
    total_evaluations: number;
    epcs_evaluated: number;
    ok_count: number;
    partial_count: number;
    bad_count: number;
    ok_pct: number;
    first_evaluation: string | null;
    last_evaluation: string | null;
    sections_evaluated: Record<string, number>;
};

type RecentEvaluation = {
    user_id: string;
    user_name: string;
    epc_id: string;
    patient_name: string | null;
    section: string;
    rating: string;
    feedback_text: string | null;
    has_omissions: boolean | null;
    has_repetitions: boolean | null;
    is_confusing: boolean | null;
    created_at: string | null;
};

type EPCRow = {
    epc_id: string;
    patient_name: string;
    evaluators: string[];
    evaluator_count: number;
    total_evaluations: number;
    ok_count: number;
    partial_count: number;
    bad_count: number;
    ok_pct: number;
    epc_created: string | null;
    first_evaluation: string | null;
    last_evaluation: string | null;
};

type SortKey = "user_name" | "epcs_evaluated" | "total_evaluations" | "ok_count" | "partial_count" | "bad_count" | "ok_pct" | "first_evaluation" | "last_evaluation";
type SortDir = "asc" | "desc";

type RecentSortKey = "user_name" | "patient_name" | "section" | "rating" | "created_at";
type EPCSortKey = "patient_name" | "evaluator_count" | "total_evaluations" | "ok_count" | "partial_count" | "bad_count" | "ok_pct" | "epc_created" | "last_evaluation";

export default function EPCControlDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [kpis, setKpis] = useState<KPIs | null>(null);
    const [byUser, setByUser] = useState<UserRow[]>([]);
    const [byEpc, setByEpc] = useState<EPCRow[]>([]);
    const [recentEvals, setRecentEvals] = useState<RecentEvaluation[]>([]);

    // Búsqueda y ordenamiento tabla usuarios
    const [searchUser, setSearchUser] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("total_evaluations");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    // Búsqueda y ordenamiento tabla pacientes
    const [searchEpc, setSearchEpc] = useState("");
    const [epcSortKey, setEpcSortKey] = useState<EPCSortKey>("last_evaluation");
    const [epcSortDir, setEpcSortDir] = useState<SortDir>("desc");

    // Búsqueda y ordenamiento tabla recientes
    const [searchRecent, setSearchRecent] = useState("");
    const [recentSortKey, setRecentSortKey] = useState<RecentSortKey>("created_at");
    const [recentSortDir, setRecentSortDir] = useState<SortDir>("desc");

    // Tab
    const [activeTab, setActiveTab] = useState<"users" | "recent">("users");

    // Export dropdowns
    const [showUserExport, setShowUserExport] = useState(false);
    const [showEpcExport, setShowEpcExport] = useState(false);

    async function loadData() {
        setLoading(true);
        setError("");
        try {
            const { data } = await api.get("/epc/admin/dashboard-control");
            setKpis(data.kpis);
            setByUser(data.by_user || []);
            setByEpc(data.by_epc || []);
            setRecentEvals(data.recent_evaluations || []);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Error cargando datos del dashboard");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadData(); }, []);

    // Sort handler for user table
    function handleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    }

    // Sort handler for EPC table
    function handleEpcSort(key: EPCSortKey) {
        if (epcSortKey === key) {
            setEpcSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setEpcSortKey(key);
            setEpcSortDir("desc");
        }
    }

    // Sort handler for recent table
    function handleRecentSort(key: RecentSortKey) {
        if (recentSortKey === key) {
            setRecentSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setRecentSortKey(key);
            setRecentSortDir("desc");
        }
    }

    function SortIcon({ col, current, dir }: { col: string; current: string; dir: SortDir }) {
        if (col !== current) return <FaSort className="epc-ctrl-sort-icon inactive" />;
        return dir === "asc" ? <FaSortUp className="epc-ctrl-sort-icon active" /> : <FaSortDown className="epc-ctrl-sort-icon active" />;
    }

    // Filtered + sorted user rows
    const filteredUsers = useMemo(() => {
        let rows = [...byUser];
        if (searchUser.trim()) {
            const q = searchUser.toLowerCase();
            rows = rows.filter(r => r.user_name.toLowerCase().includes(q));
        }
        rows.sort((a, b) => {
            let aVal: any = a[sortKey];
            let bVal: any = b[sortKey];
            if (typeof aVal === "string") { aVal = aVal.toLowerCase(); bVal = (bVal || "").toLowerCase(); }
            if (aVal == null) aVal = sortDir === "asc" ? Infinity : -Infinity;
            if (bVal == null) bVal = sortDir === "asc" ? Infinity : -Infinity;
            if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
        return rows;
    }, [byUser, searchUser, sortKey, sortDir]);

    // Filtered + sorted EPC rows
    const filteredEpcs = useMemo(() => {
        let rows = [...byEpc];
        if (searchEpc.trim()) {
            const q = searchEpc.toLowerCase();
            rows = rows.filter(r =>
                r.patient_name.toLowerCase().includes(q) ||
                r.evaluators.some(e => e.toLowerCase().includes(q))
            );
        }
        rows.sort((a, b) => {
            let aVal: any = (a as any)[epcSortKey];
            let bVal: any = (b as any)[epcSortKey];
            if (typeof aVal === "string") { aVal = aVal.toLowerCase(); bVal = (bVal || "").toLowerCase(); }
            if (aVal == null) aVal = epcSortDir === "asc" ? "\uffff" : "";
            if (bVal == null) bVal = epcSortDir === "asc" ? "\uffff" : "";
            if (aVal < bVal) return epcSortDir === "asc" ? -1 : 1;
            if (aVal > bVal) return epcSortDir === "asc" ? 1 : -1;
            return 0;
        });
        return rows;
    }, [byEpc, searchEpc, epcSortKey, epcSortDir]);

    // Filtered + sorted recent evaluations
    const filteredRecent = useMemo(() => {
        let rows = [...recentEvals];
        if (searchRecent.trim()) {
            const q = searchRecent.toLowerCase();
            rows = rows.filter(r =>
                r.user_name.toLowerCase().includes(q) ||
                (r.patient_name || "").toLowerCase().includes(q) ||
                (r.section || "").toLowerCase().includes(q)
            );
        }
        rows.sort((a, b) => {
            let aVal: any = (a as any)[recentSortKey];
            let bVal: any = (b as any)[recentSortKey];
            if (typeof aVal === "string") { aVal = aVal.toLowerCase(); bVal = (bVal || "").toLowerCase(); }
            if (aVal == null) aVal = recentSortDir === "asc" ? "\uffff" : "";
            if (bVal == null) bVal = recentSortDir === "asc" ? "\uffff" : "";
            if (aVal < bVal) return recentSortDir === "asc" ? -1 : 1;
            if (aVal > bVal) return recentSortDir === "asc" ? 1 : -1;
            return 0;
        });
        return rows;
    }, [recentEvals, searchRecent, recentSortKey, recentSortDir]);

    // ===== Export Functions =====
    function exportUsersXlsx() {
        setShowUserExport(false);
        const rows = filteredUsers.map(u => ({
            "Usuario": u.user_name,
            "EPCs": u.epcs_evaluated,
            "Total": u.total_evaluations,
            "OK": u.ok_count,
            "Parcial": u.partial_count,
            "Mal": u.bad_count,
            "% OK": u.ok_pct,
            "Primera eval.": u.first_evaluation ? new Date(u.first_evaluation).toLocaleDateString("es-AR") : "",
            "Última eval.": u.last_evaluation ? new Date(u.last_evaluation).toLocaleDateString("es-AR") : "",
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws["!cols"] = [{ wch: 20 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 14 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Evaluaciones por Usuario");
        const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `Evaluaciones_por_Usuario_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    function exportUsersPdf() {
        setShowUserExport(false);
        const doc = new jsPDF({ orientation: "landscape" });
        doc.setFontSize(16);
        doc.text("Evaluaciones por Usuario", 14, 18);
        doc.setFontSize(9);
        doc.text(`Generado: ${new Date().toLocaleString("es-AR")}`, 14, 24);
        autoTable(doc, {
            startY: 30,
            head: [["Usuario", "EPCs", "Total", "OK", "Parcial", "Mal", "% OK", "1ra eval.", "Última eval."]],
            body: filteredUsers.map(u => [
                u.user_name,
                u.epcs_evaluated,
                u.total_evaluations,
                u.ok_count,
                u.partial_count,
                u.bad_count,
                `${u.ok_pct}%`,
                u.first_evaluation ? new Date(u.first_evaluation).toLocaleDateString("es-AR") : "—",
                u.last_evaluation ? new Date(u.last_evaluation).toLocaleDateString("es-AR") : "—",
            ]),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
            alternateRowStyles: { fillColor: [241, 245, 249] },
        });
        doc.save(`Evaluaciones_por_Usuario_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    function exportEpcsXlsx() {
        setShowEpcExport(false);
        const rows = filteredEpcs.map(ep => ({
            "Paciente": ep.patient_name,
            "Evaluadores": ep.evaluators.join(", "),
            "Evaluaciones": ep.total_evaluations,
            "OK": ep.ok_count,
            "Parcial": ep.partial_count,
            "Mal": ep.bad_count,
            "% OK": ep.ok_pct,
            "Creación EPC": ep.epc_created ? new Date(ep.epc_created).toLocaleDateString("es-AR") : "",
            "Última eval.": ep.last_evaluation ? new Date(ep.last_evaluation).toLocaleDateString("es-AR") : "",
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws["!cols"] = [{ wch: 25 }, { wch: 25 }, { wch: 14 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 14 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pacientes Evaluados");
        const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `Pacientes_Evaluados_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    function exportEpcsPdf() {
        setShowEpcExport(false);
        const doc = new jsPDF({ orientation: "landscape" });
        doc.setFontSize(16);
        doc.text("Pacientes Evaluados", 14, 18);
        doc.setFontSize(9);
        doc.text(`Generado: ${new Date().toLocaleString("es-AR")}`, 14, 24);
        autoTable(doc, {
            startY: 30,
            head: [["Paciente", "Evaluadores", "Evaluaciones", "OK", "Parcial", "Mal", "% OK", "Creación", "Última eval."]],
            body: filteredEpcs.map(ep => [
                ep.patient_name,
                ep.evaluators.join(", "),
                ep.total_evaluations,
                ep.ok_count,
                ep.partial_count,
                ep.bad_count,
                `${ep.ok_pct}%`,
                ep.epc_created ? new Date(ep.epc_created).toLocaleDateString("es-AR") : "—",
                ep.last_evaluation ? new Date(ep.last_evaluation).toLocaleDateString("es-AR") : "—",
            ]),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [16, 163, 74], textColor: 255, fontStyle: "bold" },
            alternateRowStyles: { fillColor: [241, 245, 249] },
        });
        doc.save(`Pacientes_Evaluados_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    if (loading) return <div className="epc-ctrl-wrap"><div className="epc-ctrl-loading">Cargando dashboard de control...</div></div>;
    if (error && !kpis) return <div className="epc-ctrl-wrap"><div className="epc-ctrl-error">{error}</div></div>;
    if (!kpis) return <div className="epc-ctrl-wrap">Sin datos</div>;

    return (
        <div className="epc-ctrl-wrap">
            <div className="epc-ctrl-header">
                <h1><FaClipboardList /> Control de EPC - Evaluaciones</h1>
                <button className="epc-ctrl-btn-refresh" onClick={loadData}><FaSyncAlt /> Actualizar</button>
            </div>

            {/* ========== KPIs ========== */}
            <div className="epc-ctrl-kpi-grid">
                <div className="epc-ctrl-kpi epc-ctrl-kpi-primary">
                    <div className="epc-ctrl-kpi-icon"><FaFileMedical /></div>
                    <div className="epc-ctrl-kpi-data">
                        <div className="epc-ctrl-kpi-value">{kpis.total_epcs}</div>
                        <div className="epc-ctrl-kpi-label">EPCs creadas</div>
                    </div>
                </div>
                <div className="epc-ctrl-kpi epc-ctrl-kpi-info">
                    <div className="epc-ctrl-kpi-icon"><FaChartBar /></div>
                    <div className="epc-ctrl-kpi-data">
                        <div className="epc-ctrl-kpi-value">{kpis.total_evaluations}</div>
                        <div className="epc-ctrl-kpi-label">Evaluaciones</div>
                    </div>
                </div>
                <div className="epc-ctrl-kpi epc-ctrl-kpi-success">
                    <div className="epc-ctrl-kpi-icon"><FaUserMd /></div>
                    <div className="epc-ctrl-kpi-data">
                        <div className="epc-ctrl-kpi-value">{kpis.total_evaluators}</div>
                        <div className="epc-ctrl-kpi-label">Evaluadores activos</div>
                    </div>
                </div>
                <div className="epc-ctrl-kpi epc-ctrl-kpi-warning">
                    <div className="epc-ctrl-kpi-icon"><FaExclamationCircle /></div>
                    <div className="epc-ctrl-kpi-data">
                        <div className="epc-ctrl-kpi-value">{kpis.epcs_without_evaluation}</div>
                        <div className="epc-ctrl-kpi-label">EPCs sin evaluación</div>
                    </div>
                </div>
                <div className="epc-ctrl-kpi epc-ctrl-kpi-ok">
                    <div className="epc-ctrl-kpi-icon"><FaPercentage /></div>
                    <div className="epc-ctrl-kpi-data">
                        <div className="epc-ctrl-kpi-value">{kpis.approval_rate_pct}%</div>
                        <div className="epc-ctrl-kpi-label">Tasa aprobación</div>
                    </div>
                </div>
                <div className="epc-ctrl-kpi epc-ctrl-kpi-avg">
                    <div className="epc-ctrl-kpi-icon"><FaClock /></div>
                    <div className="epc-ctrl-kpi-data">
                        <div className="epc-ctrl-kpi-value">{kpis.avg_evaluations_per_user}</div>
                        <div className="epc-ctrl-kpi-label">Prom. eval/usuario</div>
                    </div>
                </div>
            </div>

            {/* ========== Tabs ========== */}
            <div className="epc-ctrl-tabs">
                <button className={`epc-ctrl-tab ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
                    <FaUserMd /> Por Usuario
                </button>
                <button className={`epc-ctrl-tab ${activeTab === "recent" ? "active" : ""}`} onClick={() => setActiveTab("recent")}>
                    <FaClock /> Evaluaciones Recientes
                </button>
            </div>

            {/* ========== TAB: Por Usuario ========== */}
            {activeTab === "users" && (
                <>
                    <div className="epc-ctrl-panel">
                        <div className="epc-ctrl-panel-header">
                            <h2><FaUserMd /> Evaluaciones por Usuario</h2>
                            <div className="epc-ctrl-header-actions">
                                <div className="epc-ctrl-export-wrap">
                                    <button className="epc-ctrl-export-btn" onClick={() => { setShowUserExport(!showUserExport); setShowEpcExport(false); }}>
                                        <FaDownload /> Descargar
                                    </button>
                                    {showUserExport && (
                                        <div className="epc-ctrl-export-menu">
                                            <button onClick={exportUsersXlsx}><FaFileExcel /> Excel (.xlsx)</button>
                                            <button onClick={exportUsersPdf}><FaFilePdf /> PDF</button>
                                        </div>
                                    )}
                                </div>
                                <div className="epc-ctrl-search-wrap">
                                    <FaSearch />
                                    <input
                                        type="text"
                                        placeholder="Buscar usuario..."
                                        value={searchUser}
                                        onChange={e => setSearchUser(e.target.value)}
                                        className="epc-ctrl-search"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="epc-ctrl-table-wrap">
                            <table className="epc-ctrl-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort("user_name")} className="sortable">
                                            Usuario <SortIcon col="user_name" current={sortKey} dir={sortDir} />
                                        </th>
                                        <th onClick={() => handleSort("epcs_evaluated")} className="sortable num">
                                            EPCs <SortIcon col="epcs_evaluated" current={sortKey} dir={sortDir} />
                                        </th>
                                        <th onClick={() => handleSort("total_evaluations")} className="sortable num">
                                            Total <SortIcon col="total_evaluations" current={sortKey} dir={sortDir} />
                                        </th>
                                        <th onClick={() => handleSort("ok_count")} className="sortable num">
                                            <FaThumbsUp className="th-icon ok" /> OK <SortIcon col="ok_count" current={sortKey} dir={sortDir} />
                                        </th>
                                        <th onClick={() => handleSort("partial_count")} className="sortable num">
                                            <FaMeh className="th-icon partial" /> Parcial <SortIcon col="partial_count" current={sortKey} dir={sortDir} />
                                        </th>
                                        <th onClick={() => handleSort("bad_count")} className="sortable num">
                                            <FaThumbsDown className="th-icon bad" /> Mal <SortIcon col="bad_count" current={sortKey} dir={sortDir} />
                                        </th>
                                        <th onClick={() => handleSort("ok_pct")} className="sortable num">
                                            % OK <SortIcon col="ok_pct" current={sortKey} dir={sortDir} />
                                        </th>
                                        <th onClick={() => handleSort("first_evaluation")} className="sortable">
                                            Primera eval. <SortIcon col="first_evaluation" current={sortKey} dir={sortDir} />
                                        </th>
                                        <th onClick={() => handleSort("last_evaluation")} className="sortable">
                                            Última eval. <SortIcon col="last_evaluation" current={sortKey} dir={sortDir} />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => {
                                        const perfClass = u.ok_pct >= 60 ? "perf-good" : u.ok_pct >= 30 ? "perf-medium" : "perf-low";
                                        return (
                                            <tr key={u.user_id}>
                                                <td className="td-user">
                                                    <div className="user-avatar">{(u.user_name || "?")[0].toUpperCase()}</div>
                                                    <span className="user-name">{u.user_name}</span>
                                                </td>
                                                <td className="num">{u.epcs_evaluated}</td>
                                                <td className="num"><strong>{u.total_evaluations}</strong></td>
                                                <td className="num ok-val">{u.ok_count}</td>
                                                <td className="num partial-val">{u.partial_count}</td>
                                                <td className="num bad-val">{u.bad_count}</td>
                                                <td className="num">
                                                    <span className={`perf-badge ${perfClass}`}>{u.ok_pct}%</span>
                                                </td>
                                                <td className="td-date" title={formatDate(u.first_evaluation)}>{timeAgo(u.first_evaluation)}</td>
                                                <td className="td-date" title={formatDate(u.last_evaluation)}>{timeAgo(u.last_evaluation)}</td>
                                            </tr>
                                        );
                                    })}
                                    {filteredUsers.length === 0 && (
                                        <tr><td colSpan={9} className="epc-ctrl-empty">No se encontraron usuarios</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ========== Tabla Pacientes Evaluados (debajo de usuarios) ========== */}
                    <div className="epc-ctrl-panel" style={{ marginTop: 20 }}>
                        <div className="epc-ctrl-panel-header">
                            <h2><FaFileMedical /> Pacientes Evaluados</h2>
                            <div className="epc-ctrl-header-actions">
                                <div className="epc-ctrl-export-wrap">
                                    <button className="epc-ctrl-export-btn" onClick={() => { setShowEpcExport(!showEpcExport); setShowUserExport(false); }}>
                                        <FaDownload /> Descargar
                                    </button>
                                    {showEpcExport && (
                                        <div className="epc-ctrl-export-menu">
                                            <button onClick={exportEpcsXlsx}><FaFileExcel /> Excel (.xlsx)</button>
                                            <button onClick={exportEpcsPdf}><FaFilePdf /> PDF</button>
                                        </div>
                                    )}
                                </div>
                                <div className="epc-ctrl-search-wrap">
                                    <FaSearch />
                                    <input
                                        type="text"
                                        placeholder="Buscar paciente o evaluador..."
                                        value={searchEpc}
                                        onChange={e => setSearchEpc(e.target.value)}
                                        className="epc-ctrl-search"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="epc-ctrl-table-wrap">
                            <table className="epc-ctrl-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleEpcSort("patient_name")} className="sortable">
                                            Paciente <SortIcon col="patient_name" current={epcSortKey} dir={epcSortDir} />
                                        </th>
                                        <th onClick={() => handleEpcSort("evaluator_count")} className="sortable num">
                                            Evaluadores <SortIcon col="evaluator_count" current={epcSortKey} dir={epcSortDir} />
                                        </th>
                                        <th onClick={() => handleEpcSort("total_evaluations")} className="sortable num">
                                            Evaluaciones <SortIcon col="total_evaluations" current={epcSortKey} dir={epcSortDir} />
                                        </th>
                                        <th onClick={() => handleEpcSort("ok_count")} className="sortable num">
                                            <FaThumbsUp className="th-icon ok" /> OK <SortIcon col="ok_count" current={epcSortKey} dir={epcSortDir} />
                                        </th>
                                        <th onClick={() => handleEpcSort("partial_count")} className="sortable num">
                                            <FaMeh className="th-icon partial" /> Parcial <SortIcon col="partial_count" current={epcSortKey} dir={epcSortDir} />
                                        </th>
                                        <th onClick={() => handleEpcSort("bad_count")} className="sortable num">
                                            <FaThumbsDown className="th-icon bad" /> Mal <SortIcon col="bad_count" current={epcSortKey} dir={epcSortDir} />
                                        </th>
                                        <th onClick={() => handleEpcSort("ok_pct")} className="sortable num">
                                            % OK <SortIcon col="ok_pct" current={epcSortKey} dir={epcSortDir} />
                                        </th>
                                        <th onClick={() => handleEpcSort("epc_created")} className="sortable">
                                            Creación EPC <SortIcon col="epc_created" current={epcSortKey} dir={epcSortDir} />
                                        </th>
                                        <th onClick={() => handleEpcSort("last_evaluation")} className="sortable">
                                            Última eval. <SortIcon col="last_evaluation" current={epcSortKey} dir={epcSortDir} />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEpcs.map(ep => {
                                        const perfClass = ep.ok_pct >= 60 ? "perf-good" : ep.ok_pct >= 30 ? "perf-medium" : "perf-low";
                                        return (
                                            <tr key={ep.epc_id}>
                                                <td className="td-user">
                                                    <div className="patient-icon">🏥</div>
                                                    <span className="user-name">{ep.patient_name}</span>
                                                </td>
                                                <td>
                                                    <div className="evaluator-names">
                                                        {ep.evaluators.map((name, idx) => (
                                                            <span key={idx} className="evaluator-pill">
                                                                <span className="user-avatar mini">{(name || "?")[0].toUpperCase()}</span>
                                                                {name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="num"><strong>{ep.total_evaluations}</strong></td>
                                                <td className="num ok-val">{ep.ok_count}</td>
                                                <td className="num partial-val">{ep.partial_count}</td>
                                                <td className="num bad-val">{ep.bad_count}</td>
                                                <td className="num">
                                                    <span className={`perf-badge ${perfClass}`}>{ep.ok_pct}%</span>
                                                </td>
                                                <td className="td-date" title={formatDate(ep.epc_created)}>{timeAgo(ep.epc_created)}</td>
                                                <td className="td-date" title={formatDate(ep.last_evaluation)}>{timeAgo(ep.last_evaluation)}</td>
                                            </tr>
                                        );
                                    })}
                                    {filteredEpcs.length === 0 && (
                                        <tr><td colSpan={9} className="epc-ctrl-empty">No se encontraron pacientes evaluados</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ========== TAB: Evaluaciones Recientes ========== */}
            {activeTab === "recent" && (
                <div className="epc-ctrl-panel">
                    <div className="epc-ctrl-panel-header">
                        <h2><FaClock /> Evaluaciones Recientes</h2>
                        <div className="epc-ctrl-search-wrap">
                            <FaSearch />
                            <input
                                type="text"
                                placeholder="Buscar usuario, paciente, sección..."
                                value={searchRecent}
                                onChange={e => setSearchRecent(e.target.value)}
                                className="epc-ctrl-search"
                            />
                        </div>
                    </div>
                    <div className="epc-ctrl-table-wrap">
                        <table className="epc-ctrl-table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleRecentSort("created_at")} className="sortable">
                                        Fecha <SortIcon col="created_at" current={recentSortKey} dir={recentSortDir} />
                                    </th>
                                    <th onClick={() => handleRecentSort("user_name")} className="sortable">
                                        Usuario <SortIcon col="user_name" current={recentSortKey} dir={recentSortDir} />
                                    </th>
                                    <th onClick={() => handleRecentSort("patient_name")} className="sortable">
                                        Paciente <SortIcon col="patient_name" current={recentSortKey} dir={recentSortDir} />
                                    </th>
                                    <th onClick={() => handleRecentSort("section")} className="sortable">
                                        Sección <SortIcon col="section" current={recentSortKey} dir={recentSortDir} />
                                    </th>
                                    <th onClick={() => handleRecentSort("rating")} className="sortable">
                                        Rating <SortIcon col="rating" current={recentSortKey} dir={recentSortDir} />
                                    </th>
                                    <th>Feedback</th>
                                    <th>Issues</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecent.map((ev, i) => (
                                    <tr key={i}>
                                        <td className="td-date" title={formatDate(ev.created_at)}>{timeAgo(ev.created_at)}</td>
                                        <td className="td-user">
                                            <div className="user-avatar mini">{(ev.user_name || "?")[0].toUpperCase()}</div>
                                            <span>{ev.user_name}</span>
                                        </td>
                                        <td>{ev.patient_name || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                                        <td>
                                            <span className="section-pill">{SECTION_LABELS[ev.section] || ev.section}</span>
                                        </td>
                                        <td>
                                            <span className={`rating-badge ${ev.rating}`}>
                                                {ev.rating === "ok" && <><FaThumbsUp /> OK</>}
                                                {ev.rating === "partial" && <><FaMeh /> Parcial</>}
                                                {ev.rating === "bad" && <><FaThumbsDown /> Mal</>}
                                            </span>
                                        </td>
                                        <td className="td-feedback">{ev.feedback_text || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                                        <td className="td-issues">
                                            {ev.has_omissions && <span className="issue-tag omissions">Omisiones</span>}
                                            {ev.has_repetitions && <span className="issue-tag repetitions">Repet.</span>}
                                            {ev.is_confusing && <span className="issue-tag confusing">Confuso</span>}
                                        </td>
                                    </tr>
                                ))}
                                {filteredRecent.length === 0 && (
                                    <tr><td colSpan={7} className="epc-ctrl-empty">No se encontraron evaluaciones</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
