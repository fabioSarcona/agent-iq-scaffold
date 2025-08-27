export type Vertical = 'dental' | 'hvac';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RecoverableRange {
  min: number; // 0..1
  max: number; // 0..1
}

export interface LossArea {
  key: string;
  title: string;
  dailyUsd: number;
  monthlyUsd: number;
  annualUsd: number;
  severity: Severity;
  recoverablePctRange: RecoverableRange; // conservative range
  rationale: string[]; // short bullet points explaining the math
}

export interface MoneyLostSummary {
  vertical: Vertical;
  dailyTotalUsd: number;
  monthlyTotalUsd: number;
  annualTotalUsd: number;
  areas: LossArea[];
  assumptions: string[]; // any assumptions & fallbacks applied
  version: string;       // bump when formulas change
}