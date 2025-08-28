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
    recoverablePct: [number, number];
    severity: 'low' | 'medium' | 'high' | 'critical';
    rationale: string;
  }>;
  export const DisclaimerNote: React.ComponentType;
}

declare module '@modules/moneylost/client' {
  export const requestMoneyLost: (vertical: string, answers: Record<string, unknown>) => Promise<{
    dailyUsd: number;
    monthlyUsd: number;
    annualUsd: number;
    areas: Array<{
      title: string;
      dailyUsd: number;
      monthlyUsd: number;
      annualUsd: number;
      recoverablePct: [number, number];
      severity: 'low' | 'medium' | 'high' | 'critical';
      rationale: string;
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

declare module '@modules/ai/voicefit' {
  export const ScoreGauge: React.ComponentType<{ score: number; band: string }>;
  export const BenchmarkNote: React.ComponentType<{ benchmarks?: string[] }>;
  export const SolutionCard: React.ComponentType<{
    skillId: string;
    title: string;
    rationale: string;
    estimatedRecoveryPct?: [number, number];
  }>;
  export const FAQAccordion: React.ComponentType<{ 
    faq: Array<{ q: string; a: string }> 
  }>;
  export const PlanCard: React.ComponentType<{
    name: string;
    priceMonthlyUsd: number;
    inclusions: string[];
    addons?: string[];
  }>;
  export const requestVoiceFitReport: (vertical: string, answers: Record<string, unknown>) => Promise<VoiceFitReportData>;
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
}
