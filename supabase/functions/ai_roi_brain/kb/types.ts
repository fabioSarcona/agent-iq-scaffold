// Shared KB Types for ROI Brain System

export interface VoiceSkill {
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
}

export interface PainPoint {
  id: string;
  vertical: "dental" | "hvac" | "both";
  category: string;
  problem: string;
  impact: string;
  frequency: "high" | "medium" | "low";
  severity: "critical" | "major" | "minor";
}

export interface PricingTier {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limitations?: string[];
  target: "starter" | "professional" | "enterprise";
}

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
  vertical?: "dental" | "hvac" | "both";
}

export interface ResponseModel {
  name: string;
  description: string;
  template: string;
  variables: string[];
  context: string;
}

export interface KBPayload {
  brand: {
    name: string;
    tagline: string;
    values: string[];
    differentiators: string[];
  };
  voiceSkills: VoiceSkill[];
  painPoints: PainPoint[];
  pricing: PricingTier[];
  responseModels?: ResponseModel[];
  faq: FAQItem[];
}

export interface CacheEntry {
  id: string;
  businessContext: string; // JSON stringified context
  kbPayload: string; // JSON stringified KB
  aiResponse: string; // JSON stringified response
  processingTime: number;
  costs: {
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
  };
  createdAt: string;
  expiresAt: string;
}

export interface ProcessingMetrics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  cacheHit: boolean;
  inputTokens?: number;
  outputTokens?: number;
  totalCost?: number;
  errors?: string[];
}