// src/pages/Admin/FeedbackDashboard/hooks/useFeedbackGrouped.ts
import { useMemo, useState } from "react";
import api from "@/api/axios";
import type { GroupedEPC, GroupedFeedbackResponse } from "@/types/feedback";

export function useFeedbackGrouped() {
    const [groupedData, setGroupedData] = useState<GroupedEPC[]>([]);
    const [loadingGrouped, setLoadingGrouped] = useState(false);
    const [searchGrouped, setSearchGrouped] = useState("");
    const [expandedEpcs, setExpandedEpcs] = useState<Set<string>>(new Set());
    const [expandedTexts, setExpandedTexts] = useState<Set<string>>(new Set());
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [deletingEvaluator, setDeletingEvaluator] = useState<string | null>(null);

    async function loadGrouped() {
        setLoadingGrouped(true);
        try {
            const { data } = await api.get<GroupedFeedbackResponse>("/epc/feedback/grouped");
            setGroupedData(data.grouped_epc || []);
        } catch (e: any) {
            throw e;
        } finally {
            setLoadingGrouped(false);
        }
    }

    function toggleEpcExpand(epcId: string) {
        setExpandedEpcs(prev => {
            const next = new Set(prev);
            if (next.has(epcId)) next.delete(epcId);
            else next.add(epcId);
            return next;
        });
    }

    function toggleTextExpand(key: string) {
        setExpandedTexts(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    const sortedGroupedData = useMemo(() => {
        let sorted = [...groupedData];
        if (searchGrouped.trim()) {
            const q = searchGrouped.toLowerCase();
            sorted = sorted.filter(epc =>
                (epc.patient_name || "").toLowerCase().includes(q) ||
                (epc.patient_id || "").toLowerCase().includes(q) ||
                (epc.epc_id || "").toLowerCase().includes(q)
            );
        }
        sorted.sort((a, b) => {
            const dateA = a.epc_created_at ? new Date(a.epc_created_at).getTime() : (sortDirection === "asc" ? Infinity : -Infinity);
            const dateB = b.epc_created_at ? new Date(b.epc_created_at).getTime() : (sortDirection === "asc" ? Infinity : -Infinity);
            return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
        });
        return sorted;
    }, [groupedData, sortDirection, searchGrouped]);

    async function deleteEvaluatorFeedback(epcId: string, evaluatorId: string, evaluatorName: string) {
        const confirmed = window.confirm(
            `¿Eliminar todas las evaluaciones de "${evaluatorName}" para esta EPC?\n\nEsta acción no se puede deshacer.`
        );
        if (!confirmed) return;

        setDeletingEvaluator(`${epcId}_${evaluatorId}`);
        try {
            await api.delete(`/epc/feedback/${epcId}/evaluator/${evaluatorId}`);
            await loadGrouped();
            return true; // signal to also reload stats
        } catch (e: any) {
            throw e;
        } finally {
            setDeletingEvaluator(null);
        }
    }

    return {
        groupedData,
        loadingGrouped,
        searchGrouped,
        setSearchGrouped,
        expandedEpcs,
        expandedTexts,
        sortDirection,
        setSortDirection,
        deletingEvaluator,
        loadGrouped,
        toggleEpcExpand,
        toggleTextExpand,
        sortedGroupedData,
        deleteEvaluatorFeedback,
    };
}
