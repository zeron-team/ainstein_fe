// src/pages/Admin/FeedbackDashboard/hooks/useFeedbackLearning.ts
import { useState } from "react";
import api from "@/api/axios";
import type { InsightsData } from "@/types/feedback";

export type LearningStats = {
    summary: {
        total_analyses: number;
        analyses_this_week: number;
        analyses_this_month: number;
        total_feedbacks_processed: number;
        total_problems_detected: number;
        total_rules_generated: number;
    };
    last_analysis: {
        timestamp: string | null;
        feedbacks_analyzed: number;
        problems_found: number;
        rules_generated: number;
    } | null;
    weekly_history: Array<{
        week: string;
        events: number;
        problems: number;
        rules: number;
    }>;
};

export function useFeedbackLearning() {
    const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [learningStats, setLearningStats] = useState<LearningStats | null>(null);
    const [expandedLearningSections, setExpandedLearningSections] = useState<Set<string>>(new Set());

    async function loadInsights() {
        setLoadingInsights(true);
        try {
            const [insightsRes, learningRes] = await Promise.all([
                api.get("/epc/feedback/insights"),
                api.get("/epc/feedback/learning-stats"),
            ]);
            setInsightsData(insightsRes.data);
            setLearningStats(learningRes.data);
        } catch (e: any) {
            throw e;
        } finally {
            setLoadingInsights(false);
        }
    }

    async function forceRefreshInsights() {
        setLoadingInsights(true);
        try {
            const res = await api.get("/epc/feedback/insights?force_refresh=true");
            setInsightsData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingInsights(false);
        }
    }

    function toggleLearningSection(sectionKey: string, type: "problems" | "rules") {
        const key = `${sectionKey}_${type}`;
        setExpandedLearningSections(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    return {
        insightsData,
        loadingInsights,
        learningStats,
        expandedLearningSections,
        loadInsights,
        forceRefreshInsights,
        toggleLearningSection,
    };
}
