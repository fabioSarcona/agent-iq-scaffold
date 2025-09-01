export type Vertical = "dental" | "hvac";

export interface KBService { 
  name: string; 
  target: "Dental" | "HVAC" | "Both"; 
  problem: string; 
  how: string; 
  roiRangeMonthly?: [number, number]; 
  tags?: string[];
}

export interface KBPayload { 
  approved_claims?: string[]; 
  services: KBService[]; 
}

export interface MoneyLostItem { 
  area: string; 
  assumptions: string[]; 
  formula: string; 
  resultMonthly: number; 
  confidence: number; 
}

export interface MoneyLostSummary { 
  items: MoneyLostItem[]; 
  totalMonthly: number; 
}

export interface VoiceFitReportData { 
  score: number; 
  diagnosis: string[]; 
  consequences: string[]; 
  solutions: Array<{
    skillId?: string; 
    title: string; 
    rationale: string;
  }>; 
  faqIds: string[]; 
  plan: {
    name: string; 
    price: number; 
    inclusions: string[]; 
    addons: string[];
  }; 
  benchmarks: {
    notes: string[];
  };
}

export interface NeedAgentIQInsight { 
  id: string; 
  key: string; 
  sectionId: string; 
  category: "revenue_opportunity" | "operational_risk"; 
  title: string; 
  description: string; 
  impact: "low" | "medium" | "high" | "very_high"; 
  urgency: "low" | "medium" | "high"; 
  monthlyImpact: number; 
  currency: "USD" | "EUR"; 
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
  benchmarkData: string; 
  data_used: string[]; 
  missing_data: string[]; 
  created_at: string; 
}