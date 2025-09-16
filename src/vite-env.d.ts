/// <reference types="vite/client" />

// Strict mode compatible module declarations for @modules alias
declare module '@modules/audit' {
  export const useAuditProgressStore: () => {
    vertical: 'dental' | 'hvac' | null;
    answers: Record<string, unknown>;
    setVertical: (vertical: 'dental' | 'hvac') => void;
    setAnswer: (questionId: string, value: unknown) => void;
    reset: () => void;
  };
  export const AuditEngine: React.ComponentType<{ industry: 'dental' | 'hvac' }>;
  export const LogsToggle: React.ComponentType;
  export const ProgressBar: React.ComponentType<{ progress: number }>;
  export const QuestionRenderer: React.ComponentType<{ question: any }>;
  export const ScoreIndicator: React.ComponentType<{ score: number }>;
  export const validateQuestion: (question: any, value: unknown) => { valid: boolean; error?: string };
  export const loadAuditConfig: (industry: string) => Promise<any>;
  export type * from './modules/audit/types';
}

declare module '@modules/audit/AuditProgressStore' {
  export const useAuditProgressStore: any;
}

declare module '@modules/moneylost/components' {
  export const MoneyLostSummaryCard: React.ComponentType<{
    dailyUsd: number;
    monthlyUsd: number;
    annualUsd: number;
  }>;
  export const LossAreaCard: React.ComponentType<{
    title: string;
    dailyUsd: number;
    monthlyUsd: number;
    annualUsd: number;
    recoverablePctRange: { min: number; max: number };
    severity: 'low' | 'medium' | 'high' | 'critical';
    rationale: string[];
  }>;
  export const DisclaimerNote: React.ComponentType;
}

declare module '@modules/moneylost/client' {
  export const requestMoneyLost: (vertical: string, answers: Record<string, unknown>) => Promise<{
    total?: {
      dailyUsd: number;
      monthlyUsd: number;
      annualUsd: number;
    };
    dailyUsd?: number;
    monthlyUsd?: number;
    annualUsd?: number;
    areas: Array<{
      key: string;
      title: string;
      dailyUsd: number;
      monthlyUsd: number;
      annualUsd: number;
      recoverablePctRange: { min: number; max: number };
      rationale: string[];
    }>;
    assumptions?: string[];
    version: string;
  }>;
}

declare module '@modules/registration/types' {
  export interface Phone {
    countryCode: string;
    national: string;
  }
}

declare module '@modules/skillscope/components/SkillScopeOverlay' {
  export const SkillScopeOverlay: React.ComponentType<{
    isOpen: boolean;
    onClose: () => void;
    payload: any;
  }>;
}

declare module '@modules/skillscope/types' {
  export interface SkillScopePayload {
    context: any;
    skill: any;
    audit: any;
    kb: any;
  }
}

declare module '@modules/ai/voicefit' {
  export const ScoreGauge: React.ComponentType<{ score: number; band: string }>;
  export const BenchmarkNote: React.ComponentType<{ notes: string[] }>;
  export const SolutionCard: React.ComponentType<{
    skillId: string;
    title: string;
    rationale: string;
    estimatedRecoveryPct?: [number, number];
  }>;
  export const FAQAccordion: React.ComponentType<{ 
    items: Array<{ q: string; a: string }> 
  }>;
  export const PlanCard: React.ComponentType<{
    name: string;
    priceMonthlyUsd: number;
    inclusions: string[];
    addons?: string[];
  }>;
  export const requestVoiceFitReport: (
    vertical: string, 
    answers: Record<string, unknown>,
    scoreSummary?: any,
    moneylost?: any,
    benchmarks?: string[]
  ) => Promise<VoiceFitReportData>;
  export const mapLLMToUI: (llmOutput: LLMOutput) => VoiceFitReportData;
  export interface VoiceFitReportData {
    score: number;
    band: 'Crisis' | 'Optimization Needed' | 'Growth Ready' | 'AI-Optimized';
    diagnosis: string[];
    consequences: string[];
    solutions: Array<{
      skillId: string;
      title: string;
      rationale: string;
      estimatedRecoveryPct?: [number, number];
    }>;
    faq: Array<{ q: string; a: string }>;
    plan: {
      name: string;
      priceMonthlyUsd: number;
      inclusions: string[];
      addons?: string[];
    };
    benchmarks?: string[];
  }
  export interface LLMOutput {
    success: boolean;
    report: {
      welcome: string;
      ai_readiness_score: number;
      quadrant: string;
      bleeding_money: Array<{
        area: string;
        estimate_monthly: number;
        currency: 'USD' | 'EUR';
        formula: string;
        assumptions: string[];
        confidence: number;
      }>;
      recommendations: {
        plan: 'Starter' | 'Growth' | 'Elite';
        voice_skills: Array<{
          name: string;
          why: string;
          expected_roi_monthly: number;
          currency: 'USD' | 'EUR';
          proof_points: string[];
        }>;
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
}
