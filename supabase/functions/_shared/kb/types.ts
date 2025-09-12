// Shared KB Types for ROI Brain System

export interface KBPayload {
  brand: any;
  voiceSkills: any;
  painPoints: any;
  pricing: any;
  responseModels?: any;
  faq: any;
}

export interface CacheEntry {
  id: string;
  businessContext: string; // JSON stringified context
  kbPayload: string; // JSON stringified KB
  aiResponse: string; // JSON stringified response
  processingTime: number;
  costs: {
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
  };
  createdAt: string;
  expiresAt: string;
}

export interface ProcessingMetrics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  cacheHit: boolean;
  inputTokens?: number;
  outputTokens?: number;
  totalCost?: number;
  errors?: string[];
}