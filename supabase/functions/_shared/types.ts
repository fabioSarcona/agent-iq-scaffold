// Shared TypeScript types for Edge Functions
// Inferred from validation schemas

import type {
  VoiceFitInputSchema,
  VoiceFitOutputSchema,
  SkillScopeInputSchema,
  SkillScopeOutputSchema,
  NeedAgentIQInputSchema,
  MoneyLostInputSchema,
  MoneyLostOutputSchema,
  OTPRequestInputSchema,
  OTPVerifyInputSchema,
  OTPRequestOutputSchema,
  OTPVerifyOutputSchema,
  BusinessContextSchema,
  SettingsSchema,
  AuditResponseSchema,
  MoneyLostItemSchema,
  KBServiceSchema,
  KBCaseStudySchema,
  NeedAgentIQInsightSchema
} from './validation.ts';
import { z } from "./zod.ts";

// Business context
export type BusinessContext = z.infer<typeof BusinessContextSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type AuditResponse = z.infer<typeof AuditResponseSchema>;
export type MoneyLostItem = z.infer<typeof MoneyLostItemSchema>;

// KB types
export type KBService = z.infer<typeof KBServiceSchema>;
export type KBCaseStudy = z.infer<typeof KBCaseStudySchema>;

// VoiceFit types
export type VoiceFitInput = z.infer<typeof VoiceFitInputSchema>;
export type VoiceFitOutput = z.infer<typeof VoiceFitOutputSchema>;

// SkillScope types
export type SkillScopeInput = z.infer<typeof SkillScopeInputSchema>;
export type SkillScopeOutput = z.infer<typeof SkillScopeOutputSchema>;

// NeedAgentIQ types
export type NeedAgentIQInput = z.infer<typeof NeedAgentIQInputSchema>;
export type NeedAgentIQInsight = z.infer<typeof NeedAgentIQInsightSchema>;

// MoneyLost types
export type MoneyLostInput = z.infer<typeof MoneyLostInputSchema>;
export type MoneyLostOutput = z.infer<typeof MoneyLostOutputSchema>;

// OTP types
export type OTPRequestInput = z.infer<typeof OTPRequestInputSchema>;
export type OTPVerifyInput = z.infer<typeof OTPVerifyInputSchema>;
export type OTPRequestOutput = z.infer<typeof OTPRequestOutputSchema>;
export type OTPVerifyOutput = z.infer<typeof OTPVerifyOutputSchema>;

// Common error response
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
    missing?: string[];
  };
  metadata?: {
    processing_time_ms: number;
    warnings?: string[];
    errorType?: string;
    timeoutOccurred?: boolean;
    apiKeyConfigured?: boolean;
  };
}

// Common success metadata
export interface SuccessMetadata {
  processing_time_ms: number;
  data_quality?: 'high' | 'medium' | 'low';
  warnings?: string[];
  model_used?: string;
  cache?: 'HIT' | 'MISS';
  errorType?: string;
  timeoutOccurred?: boolean;
  apiKeyConfigured?: boolean;
}