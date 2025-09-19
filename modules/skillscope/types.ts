// New Production-Ready Phase 5.3 Interfaces
export interface SkillScopeItem {
  skillId: string;               // anchor key (never null)
  title: string;
  summary: string;
  rationale?: string;            // personalized from ROI Brain
  integrations?: string[];       // ["CRM", "PMS", "phone"]
  phases?: Array<{
    id: string;
    title: string;
    weeks?: number;
    steps: string[];
  }>;
  implementationReadiness?: number; // 0-100
  priority?: 'high'|'medium'|'low';
  monthlyImpactUsd?: number;
  sources?: string[];            // ["roi_brain", "kb:services"]
  locale?: string;
}

export interface SkillScopeContext {
  version: string;               // "sscope-v1"
  items: SkillScopeItem[];
  generatedAt: string;
  source: 'roi_brain'|'api'|'merge';
}

// Legacy API Interface (for fallback)
export interface SkillScopePayload {
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
  };
}