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

export interface MoneyLostArea {
  id: string;           // 'missed_calls', 'patient_no_shows'
  title: string;        // 'Missed Calls', 'Patient No-Shows'
  monthlyUsd: number;   // valore numerico preciso
}

export type MoneyLostSource = 'compute' | 'legacy' | 'roi_brain_fallback';

export interface MoneyLostSummary {
  dailyUsd?: number;
  monthlyUsd: number;   // REQUIRED - non più opzionale
  annualUsd?: number;
  areas: MoneyLostArea[];
  source: MoneyLostSource;
  confidence?: number;  // 0-100
}

// Legacy interface for backward compatibility
export interface LegacyMoneyLostSummary {
  total: {
    dailyUsd: number;
    monthlyUsd: number;
    annualUsd: number;
  };
  areas: LossArea[];
  assumptions?: string[];
  version: string;
}