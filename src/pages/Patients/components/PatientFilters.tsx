// src/pages/Patients/components/PatientFilters.tsx

import {
  FaFilter,
  FaSortAlphaDown,
  FaSortAlphaUpAlt,
} from "react-icons/fa";
import { ESTADOS, SortField, SortDirection } from "../types";

interface PatientFiltersProps {
  estadoFilter: string | null;
  setEstadoFilter: (val: string | null) => void;
  search: string;
  setSearch: (val: string) => void;
  sortField: SortField;
  setSortField: (val: SortField) => void;
  sortDirection: SortDirection;
  setSortDirection: React.Dispatch<React.SetStateAction<SortDirection>>;
}

export function PatientFilters({
  estadoFilter,
  setEstadoFilter,
  search,
  setSearch,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
}: PatientFiltersProps) {
  return (
    <div className="patients-filters">
      <div className="filter-group">
        <FaFilter className="filter-icon" />
        <select
          value={estadoFilter || ""}
          onChange={(e) => setEstadoFilter(e.target.value === "" ? null : e.target.value)}
        >
          <option value="">Todos</option>
          {ESTADOS.map((e) => (
            <option key={e.key} value={e.key}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      <div className="search-group">
        <input
          type="text"
          placeholder="Buscar (apellido, nombre, DNI, HCE, habitación, cama)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Ordenamiento */}
      <div className="filter-group sort-group">
        {sortDirection === "asc" ? (
          <FaSortAlphaDown className="filter-icon" />
        ) : (
          <FaSortAlphaUpAlt className="filter-icon" />
        )}
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
        >
          <option value="epc_created_at">Fecha EPC</option>
          <option value="apellido">Apellido</option>
          <option value="nombre">Nombre</option>
        </select>
        <button
          className="sort-direction-btn"
          onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
          title={sortDirection === "asc" ? "Orden A-Z (ascendente)" : "Orden Z-A (descendente)"}
        >
          {sortDirection === "asc" ? "A-Z" : "Z-A"}
        </button>
      </div>
    </div>
  );
}
