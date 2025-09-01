export interface NeedAgentIQInput {
  auditId: string;
  auditType: 'dental' | 'hvac';
  sectionId: string;
  completedSections: string[];
  timestamp: string;
  answers: Record<string, unknown>;
  moneyLost?: {
    dailyUsd?: number;
    monthlyUsd?: number;
    annualUsd?: number;
    areas?: Array<{
      key: string;
      monthlyUsd: number;
      formula?: string;
      assumptions?: string[];
    }>;
  };
  kb: {
    services: Array<{
      name: string;
      target: 'Dental' | 'HVAC' | 'Both';
      problem: string;
      how: string;
      roiRangeMonthly?: [number, number];
      tags?: string[];
    }>;
    approved_claims: string[];
  };
}

export interface NeedAgentIQInsight {
  id: string;
  key: string;
  sectionId: string;
  category: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'low' | 'medium' | 'high';
  monthlyImpact: number;
  currency: 'USD' | 'EUR';
  recoveryRate: number;
  formula: string;
  assumptions: string[];
  confidence: number;
  skill: {
    name: string;
    why: string;
    proof_points: string[];
  };
  actionItems: string[];
  benchmarkData?: Record<string, unknown>;
  data_used: string[];
  missing_data: string[];
  created_at: string;
}