// src/pages/EPC/hooks/useEpcCorrections.ts
// Corrections drag/drop state and API persistence

import { useEffect, useMemo, useState } from "react";
import api from "@/api/axios";
import { multilineToArray } from "@/utils/format";

export type SectionName = "estudios" | "procedimientos" | "interconsultas";

export type LocalCorrectionEntry = {
  item: string;
  from_section: string;
  to_section: string | null;
  action: string;
  created_at: string | null;
};

export interface UseEpcCorrectionsArgs {
  id: string | undefined;
  estudiosText: string;
  procedimientosText: string;
  interconsultasText: string;
  setEstudiosText: (v: string) => void;
  setProcedimientosText: (v: string) => void;
  setInterconsultasText: (v: string) => void;
  onSave: () => Promise<void>;
}

export interface EpcCorrectionsState {
  localCorrections: LocalCorrectionEntry[];
  correctionsSummary: { move: number; remove: number; confirm: number; total: number };
  handleSectionItemsChange: (section: SectionName, items: string[]) => void;
  handleItemDropped: (item: string, fromSection: SectionName, toSection: SectionName) => void;
  handleItemRemoved: (item: string, fromSection: SectionName) => void;
  handleItemConfirmed: (item: string, section: SectionName) => void;
}

export function useEpcCorrections(args: UseEpcCorrectionsArgs): EpcCorrectionsState {
  const {
    id, estudiosText, procedimientosText, interconsultasText,
    setEstudiosText, setProcedimientosText, setInterconsultasText,
    onSave,
  } = args;

  const [localCorrections, setLocalCorrections] = useState<LocalCorrectionEntry[]>([]);

  const textSetters: Record<SectionName, (text: string) => void> = {
    estudios: setEstudiosText,
    procedimientos: setProcedimientosText,
    interconsultas: setInterconsultasText,
  };

  const textGetters: Record<SectionName, () => string> = {
    estudios: () => estudiosText,
    procedimientos: () => procedimientosText,
    interconsultas: () => interconsultasText,
  };

  // Load corrections on mount
  useEffect(() => {
    if (!id) return;
    api.get(`/epc/${id}/section-corrections`)
      .then((res: any) => {
        setLocalCorrections(res.data?.corrections || []);
      })
      .catch(() => { });
  }, [id]);

  const correctionsSummary = useMemo(() => {
    const s = { move: 0, remove: 0, confirm: 0, total: localCorrections.length };
    localCorrections.forEach((c) => {
      if (c.action === "move") s.move++;
      else if (c.action === "remove") s.remove++;
      else if (c.action === "confirm") s.confirm++;
    });
    return s;
  }, [localCorrections]);

  function handleSectionItemsChange(section: SectionName, items: string[]) {
    textSetters[section](items.join("\n"));
  }

  function handleItemDropped(item: string, fromSection: SectionName, toSection: SectionName) {
    // Remove from source
    const sourceItems = multilineToArray(textGetters[fromSection]());
    const newSourceItems = sourceItems.filter((t) => t !== item);
    textSetters[fromSection](newSourceItems.join("\n"));

    // Add to destination
    const destItems = multilineToArray(textGetters[toSection]());
    destItems.push(item);
    textSetters[toSection](destItems.join("\n"));

    // Track locally
    setLocalCorrections((prev) => [
      { item, from_section: fromSection, to_section: toSection, action: "move", created_at: new Date().toISOString() },
      ...prev,
    ]);

    // Save to backend (fire-and-forget)
    if (id) {
      api.post(`/epc/${id}/section-corrections`, {
        corrections: [{ item, from_section: fromSection, to_section: toSection, action: "move" }],
      }).catch(() => { });
    }

    // Auto-save
    setTimeout(() => onSave(), 100);
  }

  function handleItemRemoved(item: string, fromSection: SectionName) {
    setLocalCorrections((prev) => [
      { item, from_section: fromSection, to_section: null, action: "remove", created_at: new Date().toISOString() },
      ...prev,
    ]);

    if (id) {
      api.post(`/epc/${id}/section-corrections`, {
        corrections: [{ item, from_section: fromSection, to_section: null, action: "remove" }],
      }).catch(() => { });
    }

    setTimeout(() => onSave(), 100);
  }

  function handleItemConfirmed(item: string, section: SectionName) {
    setLocalCorrections((prev) => [
      { item, from_section: section, to_section: null, action: "confirm", created_at: new Date().toISOString() },
      ...prev,
    ]);

    if (id) {
      api.post(`/epc/${id}/section-corrections`, {
        corrections: [{ item, from_section: section, to_section: null, action: "confirm" }],
      }).catch(() => { });
    }
  }

  return {
    localCorrections,
    correctionsSummary,
    handleSectionItemsChange,
    handleItemDropped,
    handleItemRemoved,
    handleItemConfirmed,
  };
}
