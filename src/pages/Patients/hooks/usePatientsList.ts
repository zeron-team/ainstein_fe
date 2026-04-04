// src/pages/Patients/hooks/usePatientsList.ts

import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/api/axios";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatApiError } from "@/utils/error";
import {
  PacienteItem,
  ListResponse,
  SortField,
  SortDirection,
  ESTADOS,
  DEFAULT_PAGE_SIZE,
} from "../types";

export function usePatientsList() {
  const [items, setItems] = useState<PacienteItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brainThinking, setBrainThinking] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>("epc_created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const listAbortRef = useRef<AbortController | null>(null);

  const estadoLabel = useMemo(() => {
    if (!estadoFilter) return "Todos";
    const found = ESTADOS.find((e) => e.key === estadoFilter);
    return found ? found.label : "Todos";
  }, [estadoFilter]);

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    sorted.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      switch (sortField) {
        case "apellido":
          valA = (a.apellido || "").toLowerCase();
          valB = (b.apellido || "").toLowerCase();
          break;
        case "nombre":
          valA = (a.nombre || "").toLowerCase();
          valB = (b.nombre || "").toLowerCase();
          break;
        case "epc_created_at":
          valA = a.epc_created_at ? new Date(a.epc_created_at).getTime() : (sortDirection === "asc" ? Infinity : -Infinity);
          valB = b.epc_created_at ? new Date(b.epc_created_at).getTime() : (sortDirection === "asc" ? Infinity : -Infinity);
          break;
        default:
          valA = "";
          valB = "";
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [items, sortField, sortDirection]);

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoFilter, debouncedSearch]);

  async function fetchData() {
    try {
      if (listAbortRef.current) listAbortRef.current.abort();
      const controller = new AbortController();
      listAbortRef.current = controller;

      setLoading(true);
      setError(null);
      const params: any = {
        page,
        page_size: pageSize,
      };
      if (estadoFilter) params.estado = estadoFilter;
      if (debouncedSearch.trim()) params.q = debouncedSearch.trim();

      const { data } = await api.get<ListResponse>("/patients", {
        params,
        signal: controller.signal,
      });

      setItems(data.items);
      setTotal(data.total);
      setHasNext(data.has_next);
      setHasPrev(data.has_prev);
    } catch (e: any) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      setError(formatApiError(e, "Error al cargar pacientes"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    return () => {
      if (listAbortRef.current) listAbortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, estadoFilter, debouncedSearch]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("ellipsis");
      if (totalPages > 1) pages.push(totalPages);
    }

    return pages;
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  return {
    items,
    setItems,
    sortedItems,
    page,
    setPage,
    pageSize,
    total,
    hasNext,
    hasPrev,
    estadoFilter,
    setEstadoFilter,
    search,
    setSearch,
    loading,
    actionLoading,
    setActionLoading,
    error,
    setError,
    brainThinking,
    setBrainThinking,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    estadoLabel,
    totalPages,
    getVisiblePages,
    handlePageSizeChange,
    fetchData,
  };
}
