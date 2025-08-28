/// <reference types="vite/client" />

// Module declarations for @modules alias
declare module '@modules/audit' {
  export const useAuditProgressStore: any;
  export const AuditEngine: any;
  export const LogsToggle: any;
  export const ProgressBar: any;
  export const QuestionRenderer: any;
  export const ScoreIndicator: any;
  export const validateQuestion: any;
  export const loadAuditConfig: any;
  export type * from './modules/audit/types';
}

declare module '@modules/audit/AuditProgressStore' {
  export const useAuditProgressStore: any;
}

declare module '@modules/moneylost/components' {
  export const MoneyLostSummaryCard: any;
  export const LossAreaCard: any;
  export const DisclaimerNote: any;
}

declare module '@modules/moneylost/client' {
  export const requestMoneyLost: any;
}

declare module '@modules/registration/types' {
  export interface Phone {
    countryCode: string;
    national: string;
  }
}

declare module '@modules/ai/voicefit' {
  export const ScoreGauge: any;
  export const BenchmarkNote: any;
  export const SolutionCard: any;
  export const FAQAccordion: any;
  export const PlanCard: any;
  export const requestVoiceFitReport: any;
  export type VoiceFitReportData = any;
}
