// src/pages/Admin/FeedbackDashboard/hooks/useFeedbackCorrections.ts
import { useState } from "react";
import api from "@/api/axios";
import type { CorrectionEntry, DictionaryRule, PendingAction } from "@/types/feedback";

export function useFeedbackCorrections() {
    const [correctionsData, setCorrectionsData] = useState<CorrectionEntry[]>([]);
    const [loadingCorrections, setLoadingCorrections] = useState(false);
    const [dictionaryRules, setDictionaryRules] = useState<DictionaryRule[]>([]);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);

    async function loadCorrections() {
        setLoadingCorrections(true);
        try {
            const [corrRes, dictRes] = await Promise.all([
                api.get("/epc/feedback/corrections"),
                api.get("/epc/feedback/section-dictionary"),
            ]);
            setCorrectionsData(corrRes.data.corrections || []);
            setDictionaryRules(dictRes.data.rules || []);
        } catch (e: any) {
            throw e;
        } finally {
            setLoadingCorrections(false);
        }
    }

    async function approveCorrection(correctionId: string, status: "approved" | "rejected") {
        setApprovingId(correctionId);
        setPendingAction(null);
        try {
            await api.patch(`/epc/section-corrections/${correctionId}/approve`, { status });
            await loadCorrections();
        } catch (e: any) {
            throw e;
        } finally {
            setApprovingId(null);
        }
    }

    function requestApproval(correctionId: string, status: "approved" | "rejected", itemText: string) {
        setPendingAction({ correctionId, status, itemText });
    }

    async function markAsConsultar(correctionId: string) {
        setApprovingId(correctionId);
        try {
            await api.patch(`/epc/section-corrections/${correctionId}/approve`, { status: "consultar" });
            await loadCorrections();
        } catch (e: any) {
            throw e;
        } finally {
            setApprovingId(null);
        }
    }

    async function revokeApproval(correctionId: string) {
        setApprovingId(correctionId);
        try {
            await api.patch(`/epc/section-corrections/${correctionId}/approve`, { status: "pending" });
            await loadCorrections();
        } catch (e: any) {
            throw e;
        } finally {
            setApprovingId(null);
        }
    }

    return {
        correctionsData,
        loadingCorrections,
        dictionaryRules,
        approvingId,
        pendingAction,
        setPendingAction,
        loadCorrections,
        approveCorrection,
        requestApproval,
        markAsConsultar,
        revokeApproval,
    };
}
