export type Confidence = 'low' | 'medium' | 'high';

export interface LossArea {
  id: string;                // e.g., "missed_calls"
  title: string;             // e.g., "Missed Calls Revenue Loss"
  dailyUsd: number;
  monthlyUsd: number;        // daily * workdays (mock: dental=22, hvac=26)
  annualUsd: number;         // monthly * 12
  recoverablePctRange: [number, number]; // e.g., [0.35, 0.60]
  confidence: Confidence;    // 'high' if both quantity & value known; else 'medium'/'low'
  notes?: string;
}

export interface MoneyLostSummary {
  dailyUsd: number;
  monthlyUsd: number;
  annualUsd: number;
  areas: LossArea[];
}