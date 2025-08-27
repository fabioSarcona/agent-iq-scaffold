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
}