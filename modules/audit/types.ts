export type QuestionType = 'multiple_choice' | 'number' | 'currency' | 'text';

export interface QuestionOption {
  value: string;                 // machine value
  label: string;                 // user-facing
  score?: number;                // optional scoring for multiple_choice
}

export interface QuestionValidation {
  min?: number;
  max?: number;
  step?: number;
  currency?: 'USD';
  pattern?: string;
}

export interface QuestionMap {
  lossArea?: string;             // e.g., "Missed Calls Revenue Loss"
  weight?: number;               // 0..1 (for later scoring/ROI)
}

export interface Question {
  id: string;
  label: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options?: QuestionOption[];    // for multiple_choice
  validation?: QuestionValidation;
  map?: QuestionMap;
}

export interface AuditSection {
  id: string;                    // e.g., "practice_profile"
  preHeadline: string;           // small kicker
  headline: string;              // section title
  description: string;           // section intro
  questions: Question[];
}

export interface AuditConfig {
  version: number;
  vertical: 'dental' | 'hvac';
  sections: AuditSection[];
}

export interface AuditAnswer {
  questionId: string;
  value: unknown;
  timestamp: Date;
}