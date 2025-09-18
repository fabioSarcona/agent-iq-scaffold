// Knowledge Base Loader Module
// Loads and filters KB data based on business context

import { extractRelevantKB } from '../_shared/kb/roibrain.ts';
import type { KBPayload } from '../_shared/kb/types.ts';
import type { BusinessContextNormalized } from './businessExtractor.ts';

export interface KBFilter {
  signalTags?: string[];
  excludeCategories?: string[];
  maxItems?: {
    voiceSkills?: number;
    painPoints?: number;
    faqItems?: number;
  };
}

/**
 * Loads filtered KB data based on business context and optional signal tags
 * @param businessContext - Normalized business context data
 * @param filters - Optional filters to apply to KB data
 * @returns Filtered KBPayload with relevant data for the business context
 */
export function loadFilteredKB(
  businessContext: BusinessContextNormalized, 
  filters?: KBFilter
): KBPayload {
  // Use the centralized KB extraction function
  const baseKB = extractRelevantKB(businessContext);
  
  if (!filters) {
    return baseKB;
  }

  // Apply signal tag filtering if specified
  let filteredKB = { ...baseKB };

  if (filters.signalTags && filters.signalTags.length > 0) {
    // Filter voice skills by signal tags
    if (filteredKB.voiceSkills) {
      filteredKB.voiceSkills = filteredKB.voiceSkills.filter(skill => 
        skill.tags?.some(tag => filters.signalTags!.includes(tag)) || 
        !skill.tags // Include skills without tags as they're considered universal
      );
    }
  }

  // Apply category exclusions
  if (filters.excludeCategories && filters.excludeCategories.length > 0) {
    if (filteredKB.painPoints) {
      filteredKB.painPoints = filteredKB.painPoints.filter(point => 
        !filters.excludeCategories!.includes(point.category)
      );
    }

    if (filteredKB.faq) {
      filteredKB.faq = filteredKB.faq.filter(item => 
        !filters.excludeCategories!.includes(item.category)
      );
    }
  }

  // Apply max item limits
  if (filters.maxItems) {
    if (filters.maxItems.voiceSkills && filteredKB.voiceSkills) {
      filteredKB.voiceSkills = filteredKB.voiceSkills.slice(0, filters.maxItems.voiceSkills);
    }

    if (filters.maxItems.painPoints && filteredKB.painPoints) {
      filteredKB.painPoints = filteredKB.painPoints.slice(0, filters.maxItems.painPoints);
    }

    if (filters.maxItems.faqItems && filteredKB.faq) {
      filteredKB.faq = filteredKB.faq.slice(0, filters.maxItems.faqItems);
    }
  }

  return filteredKB;
}

/**
 * Gets KB data optimized for AI prompt generation
 * @param businessContext - Normalized business context
 * @param priorityAreas - Array of priority areas to focus on
 * @returns Optimized KB payload for AI prompting
 */
export function getKBForPrompt(
  businessContext: BusinessContextNormalized,
  priorityAreas: string[] = []
): KBPayload {
  const filters: KBFilter = {
    maxItems: {
      voiceSkills: 8, // Limit to prevent prompt bloat
      painPoints: 10,
      faqItems: 12
    }
  };

  // Add signal tags based on priority areas
  if (priorityAreas.length > 0) {
    filters.signalTags = priorityAreas;
  }

  return loadFilteredKB(businessContext, filters);
}

/**
 * Validates KB payload completeness for AI processing
 * @param kbPayload - KB payload to validate
 * @returns Validation result with warnings if incomplete
 */
export function validateKBCompleteness(kbPayload: KBPayload): {
  isComplete: boolean;
  warnings: string[];
  missingElements: string[];
} {
  const warnings: string[] = [];
  const missingElements: string[] = [];

  if (!kbPayload.brand) {
    missingElements.push('brand');
    warnings.push('Brand information missing from KB payload');
  }

  if (!kbPayload.voiceSkills || kbPayload.voiceSkills.length === 0) {
    missingElements.push('voiceSkills');
    warnings.push('No voice skills available in KB payload');
  }

  if (!kbPayload.painPoints || kbPayload.painPoints.length === 0) {
    missingElements.push('painPoints');
    warnings.push('No pain points available in KB payload');
  }

  if (!kbPayload.pricing || kbPayload.pricing.length === 0) {
    missingElements.push('pricing');
    warnings.push('No pricing information available in KB payload');
  }

  if (!kbPayload.faq || kbPayload.faq.length === 0) {
    missingElements.push('faq');
    warnings.push('No FAQ items available in KB payload');
  }

  const isComplete = missingElements.length === 0;

  return {
    isComplete,
    warnings,
    missingElements
  };
}