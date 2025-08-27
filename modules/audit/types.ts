export type Vertical = 'dental' | 'hvac';
export type QuestionType = 'multiple-choice' | 'number' | 'currency' | 'text';
export type RangeMode = 'higher-is-better' | 'lower-is-better';

export interface AuditOption { 
  value: string; 
  label: string; 
  score?: number; 
}

export interface AuditQuestion {
  id: string; 
  type: QuestionType; 
  label: string; 
  description?: string;
  options?: AuditOption[]; 
  min?: number; 
  max?: number; 
  step?: number; 
  placeholder?: string; 
  required?: boolean;
  scoring?: { kind: 'options'; max: number } | { kind: 'range'; mode: RangeMode; min: number; max: number };
  sectionId: string;
}

export interface AuditSection { 
  id: string; 
  preHeadline: string; 
  headline: string; 
  description?: string; 
  questions: AuditQuestion[]; 
}

export interface AuditConfig { 
  vertical: Vertical; 
  sections: AuditSection[]; 
}

export interface SectionScore { 
  sectionId: string; 
  score: number; 
}

export interface ScoreSummary { 
  overall: number; 
  sections: SectionScore[]; 
}

// Legacy type aliases for backward compatibility
export type Question = AuditQuestion;
export type QuestionOption = AuditOption;
export type QuestionValidation = {
  min?: number;
  max?: number;
  step?: number;
  currency?: 'USD';
  pattern?: string;
};
export type QuestionMap = {
  lossArea?: string;
  weight?: number;
};

export function normalizeOptionScore(val: number, max: number) { 
  const v = Math.max(0, Math.min(max, val)); 
  return Math.round((v / max) * 100); 
}

export function normalizeRangeScore(input: number, mode: RangeMode, min: number, max: number) {
  const c = Math.max(min, Math.min(max, input)); 
  const pct = (c - min) / Math.max(1, (max - min));
  return Math.round((mode === 'higher-is-better' ? pct : 1 - pct) * 100);
}