// Legacy UI types (maintained for compatibility)
export interface RecommendedSolution {
  skillId: string;            // e.g., "Reception 24/7 Agent"
  title: string;              // user-facing
  rationale: string;          // short why-this-matters line
  estimatedRecoveryPct?: [number, number]; // optional: 35–60
}

export interface RecommendedPlan {
  name: string;               // e.g., "Command"
  priceMonthlyUsd: number;    // 199
  inclusions: string[];       // bullets
  addons?: string[];          // optional add-ons
}

export interface VoiceFitReportData {
  score: number;              // 1–100
  band: 'Crisis' | 'Optimization Needed' | 'Growth Ready' | 'AI-Optimized';
  diagnosis: string[];        // bullets
  consequences: string[];     // quantified from mock MoneyLost
  solutions: RecommendedSolution[];
  faq: Array<{ q: string; a: string }>;
  plan: RecommendedPlan;
  benchmarks?: string[];      // notes about sector/local benchmarks used
  
  // FASE 2.2: SkillScope Context from ROI Brain (optional for backward compatibility)
  skillScopeContext?: {
    recommendedSkills: Array<{
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
      priority: "high" | "medium" | "low";
      rationale: string;
    }>;
    contextSummary: string;
    implementationReadiness: number; // 1-100 scale
  };
  
  // FASE 4.3: Money Lost Data from ROI Brain
  moneyLost?: {
    monthlyUsd: number;
    dailyUsd?: number;
    annualUsd?: number;
    areas: Array<{
      id: string;
      title: string;
      monthlyUsd: number;
    }>;
    source: 'compute' | 'legacy' | 'roi_brain_fallback';
    confidence?: number;
  };
  
  // ROI Brain metadata (added by adapter when ROI Brain is used)
  _roiBrainMetadata?: {
    sessionId: string;
    processingTime: number;
    cacheHit: boolean;
    costs?: {
      inputTokens: number;
      outputTokens: number;
      totalCost: number;
    };
    needAgentIQInsights?: Array<{
      key: string;
      title: string;
      description: string;
      impact: string;
      priority: 'low' | 'medium' | 'high';
      category: string;
      actionable: boolean;
      monthlyImpactUsd?: number;
    }>;
    moneyLostSummary?: {
      monthlyUsd: number;
      dailyUsd?: number;
      annualUsd?: number;
      areas: Array<{
        id: string;
        title: string;
        monthlyUsd: number;
      }>;
      source: 'compute' | 'legacy' | 'roi_brain_fallback';
      confidence?: number;
    };
  };
}

// New LLM-based types (from schemas)
export interface LLMVoiceSkill {
  name: string;
  why: string;
  expected_roi_monthly: number;
  currency: 'USD' | 'EUR';
  proof_points: string[];
}

export interface LLMBleedingMoney {
  area: string;
  estimate_monthly: number;
  currency: 'USD' | 'EUR';
  formula: string;
  assumptions: string[];
  confidence: number;
}

export interface LLMOutput {
  success: boolean;
  report: {
    welcome: string;
    ai_readiness_score: number;
    quadrant: 'Low-ROI/Low-Readiness' | 'High-ROI/Low-Readiness' | 'Low-ROI/High-Readiness' | 'High-ROI/High-Readiness';
    bleeding_money: LLMBleedingMoney[];
    recommendations: {
      plan: 'Starter' | 'Growth' | 'Elite';
      voice_skills: LLMVoiceSkill[];
    };
    next_steps: {
      primary_cta: {
        label: string;
        url: string;
      };
      secondary: string[];
    };
  };
  calculations: {
    total_estimated_recovery_monthly: number;
    currency: 'USD' | 'EUR';
    logic_notes: string[];
  };
  confidence_score: number;
  metadata: {
    processing_time_ms: number;
    data_quality: 'high' | 'medium' | 'low';
    warnings: string[];
  };
  error?: {
    message: string;
    missing: string[];
  };
}