export type Vertical = 'dental' | 'hvac';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

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
  recoverablePctRange: RecoverableRange;
  rationale: string[];
}

export interface MoneyLostSummary {
  total: {
    dailyUsd: number;
    monthlyUsd: number;
    annualUsd: number;
  };
  areas: LossArea[];
  assumptions?: string[];
  version: string;
}