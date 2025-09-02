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