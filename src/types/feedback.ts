// src/types/feedback.ts

export type FeedbackStats = {
  summary: {
    total: number;
    ok: number;
    partial: number;
    bad: number;
    ok_pct: number;
    partial_pct: number;
    bad_pct: number;
  };
  by_section: Record<
    string,
    { ok: number; partial: number; bad: number; total: number }
  >;
  questions_summary: {
    omissions: number;
    repetitions: number;
    confusing: number;
  };
  questions_by_section: Record<
    string,
    {
      omissions: number;
      repetitions: number;
      confusing: number;
      total_negative: number;
    }
  >;
  recent_feedbacks: Array<{
    id: string;
    epc_id: string;
    section: string;
    rating: string;
    feedback_text: string;
    created_by_name: string;
    created_at: string;
  }>;
  insights: Array<{
    type: string;
    section: string;
    message: string;
  }>;
  trends?: {
    global_current_pct: number;
    global_previous_pct: number;
    global_change_pct: number;
    global_status: string;
    by_section: Array<{
      section: string;
      current_ok_pct: number;
      previous_ok_pct: number;
      change_pct: number;
      status: string;
      current_total: number;
      previous_total: number;
    }>;
    current_week_total: number;
    previous_week_total: number;
  };
};

export type GroupedSection = {
  section: string;
  rating: string;
  feedback_text: string | null;
  created_at: string | null;
  has_omissions?: boolean | null;
  has_repetitions?: boolean | null;
  is_confusing?: boolean | null;
};

export type GroupedEvaluator = {
  evaluator_id: string;
  evaluator_name: string;
  evaluated_at: string | null;
  sections: GroupedSection[];
};

export type GroupedEPC = {
  epc_id: string;
  patient_id: string | null;
  patient_name: string | null;
  hce_origin_id: string | null;
  epc_created_at: string | null;
  evaluators: GroupedEvaluator[];
  total_sections_evaluated: number;
};

export type GroupedFeedbackResponse = {
  grouped_epc: GroupedEPC[];
};

export interface Problem {
  category: string;
  count: number;
  severity: "alta" | "media" | "baja";
  percentage: number;
  examples: string[];
}

export interface RuleWithStatus {
  text: string;
  status: "detected" | "pending" | "applied" | "resolved";
  section?: string;
  detected_at?: string;
}

export interface SectionLearning {
  key: string;
  name: string;
  stats: {
    total: number;
    ok: number;
    partial: number;
    bad: number;
    ok_pct: number;
    negative_pct: number;
  };
  problems: Problem[];
  rules: RuleWithStatus[] | string[];
  summary: string;
  questions_stats?: {
    omissions: number;
    repetitions: number;
    confusing: number;
  };
}

export interface InsightsData {
  sections: SectionLearning[];
  total_feedbacks_analyzed: number;
  computed_at: string | null;
}

export type CorrectionEntry = {
  _id: string;
  epc_id: string;
  item: string;
  from_section: string;
  to_section: string | null;
  action: string;
  user_id: string | null;
  user_name: string | null;
  created_at: string | null;
  patient_id: string | null;
  patient_name: string | null;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
};

export type AuditEntry = {
  action: string;
  by: string;
  at: string;
  patient_id?: string;
  type?: string;
};

export type DictionaryRule = {
  id: string;
  item_pattern: string;
  target_section: string;
  frequency: number;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
  audit_log?: AuditEntry[];
};

export type PendingAction = {
  correctionId: string;
  status: "approved" | "rejected";
  itemText: string;
} | null;
