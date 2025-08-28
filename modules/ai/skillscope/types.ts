export interface SkillScopeOutput {
  success: boolean;
  skillScope?: {
    header: {
      skill_name: string;
      vertical: "Dental" | "HVAC";
      business_size: "Small" | "Medium" | "Large";
      summary: string;
    };
    what_it_does: string;
    how_it_works: {
      trigger: string;
      process: string;
      actions: string[];
      integrations: string[];
      follow_up: string;
    };
    revenue_impact: {
      statement: string;
      expected_roi_monthly: number;
      currency: "USD" | "EUR";
      formula: string;
      assumptions: string[];
      confidence: number;
    };
    key_benefits: string[];
    implementation: {
      timeline_weeks: number;
      phases: string[];
    };
    proven_results: {
      stats: string[];
      typical_for_size: string;
    };
    requirements: {
      prerequisites: string[];
      data_needed: string[];
    };
    cta: {
      primary: {
        label: string;
        url: string;
      };
      secondary: string[];
    };
  };
  confidence_score?: number;
  metadata?: {
    processing_time_ms: number;
    data_quality: "high" | "medium" | "low";
    warnings: string[];
  };
  error?: {
    message: string;
    missing?: string[];
  };
}

export interface SkillScopeInput {
  context: {
    auditId: string;
    auditType: "dental" | "hvac";
    business: {
      name: string;
      location: string;
      size?: {
        chairs?: number;
        techs?: number;
      };
    };
    settings: {
      currency?: "USD" | "EUR";
      locale?: "en-US" | "it-IT";
      maxLength?: number;
      tone?: "consultative" | "direct" | "friendly";
    };
  };
  skill: {
    id: string;
    name: string;
    target: "Dental" | "HVAC" | "Both";
    problem: string;
    how: string;
    roiRangeMonthly?: [number, number];
    implementation?: {
      time_weeks?: number;
      phases?: string[];
    };
    integrations?: string[];
    tags?: string[];
  };
  audit?: {
    responses?: Array<{
      key: string;
      value: any;
    }>;
    aiReadinessScore?: number;
    sectionScores?: Record<string, number>;
  };
  moneyLost?: {
    items: Array<{
      area: string;
      formula: string;
      assumptions: string[];
      resultMonthly: number;
      confidence: number;
    }>;
    totalMonthly: number;
  };
  kb: {
    approved_claims: string[];
    services: Array<{
      name: string;
      target: "Dental" | "HVAC" | "Both";
      problem: string;
      how: string;
      roiRangeMonthly?: [number, number];
      tags?: string[];
    }>;
    case_studies?: Array<{
      skillName: string;
      vertical: "Dental" | "HVAC";
      metric: string;
      timeframe?: string;
    }>;
  };
}