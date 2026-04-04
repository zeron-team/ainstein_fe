// src/pages/Admin/FeedbackDashboard/hooks/useFeedbackStats.ts
import { useEffect, useState } from "react";
import api from "@/api/axios";
import type { FeedbackStats } from "@/types/feedback";

export function useFeedbackStats() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [stats, setStats] = useState<FeedbackStats | null>(null);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        setLoading(true);
        setError("");
        try {
            const { data } = await api.get("/epc/feedback/stats");
            setStats(data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Error cargando estadísticas");
        } finally {
            setLoading(false);
        }
    }

    return { loading, error, setError, stats, loadStats };
}
