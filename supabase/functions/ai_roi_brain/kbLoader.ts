// Knowledge Base Loader Module
// Loads and filters KB data based on business context

import { extractRelevantKB } from '../_shared/kb/roibrain.ts';
import type { KBPayload } from '../_shared/kb/types.ts';
import type { BusinessContextNormalized } from './businessExtractor.ts';
import { 
  extractSignalTags, 
  getKBSectionsForTags, 
  validateKBBindings,
  getSignalExtractionMetrics,
  SIGNAL_RULES_VERSION 
} from './signalRules.ts';
import { stableSort } from './cache.ts';

// KB Version for cache invalidation
export const KB_VERSION = 'roibrain-centralized-v1.1';

export interface KBFilter {
  signalTags?: string[];
  kbSections?: string[];
  excludeCategories?: string[];
  maxItems?: {
    voiceSkills?: number;
    painPoints?: number;
    faqItems?: number;
    totalSections?: number;
  };
}

export interface LoadKBResult {
  filteredKB: KBPayload;
  signalTags: string[];
  kbSectionsSelected: string[];
  kbFilterSignature: string;
  metrics?: {
    rulesMatched: number;
    totalRules: number;
    validationWarnings: string[];
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
 * Generate robust KB filter signature for cache key
 * @param filters - KBFilter object with all filtering parameters
 * @param signalTags - Array of signal tags
 * @param kbSections - Array of KB section IDs
 * @returns Deterministic string representing complete filter configuration
 */
export function generateKBFilterSignature(
  vertical: 'dental' | 'hvac',
  filters?: KBFilter, 
  signalTags?: string[], 
  kbSections?: string[]
): string {
  // Build comprehensive filter object for stable stringification
  const filterConfig = {
    v: vertical, // Include vertical in signature for proper cache isolation
    signalTags: signalTags ? signalTags.sort() : [],
    kbSections: kbSections ? kbSections.sort() : [],
    excludeCategories: filters?.excludeCategories ? filters.excludeCategories.sort() : [],
    maxItems: filters?.maxItems || {},
    signalRulesVersion: SIGNAL_RULES_VERSION,
    kbVersion: KB_VERSION
  };

  // Use stable stringify to ensure deterministic signature
  const stableConfig = stableSort(filterConfig);
  return JSON.stringify(stableConfig);
}

/**
 * Legacy signature generation for backward compatibility
 * @deprecated Use generateKBFilterSignature with full parameters
 */
export function generateKBFilterSignatureLegacy(filters?: KBFilter): string {
  if (!filters) return 'no-filters';
  
  const parts = [];
  
  if (filters.signalTags && filters.signalTags.length > 0) {
    parts.push('tags:' + filters.signalTags.sort().join(','));
  }
  
  if (filters.excludeCategories && filters.excludeCategories.length > 0) {
    parts.push('exclude:' + filters.excludeCategories.sort().join(','));
  }
  
  if (filters.maxItems) {
    const maxParts = [];
    if (filters.maxItems.voiceSkills) maxParts.push(`vs:${filters.maxItems.voiceSkills}`);
    if (filters.maxItems.painPoints) maxParts.push(`pp:${filters.maxItems.painPoints}`);
    if (filters.maxItems.faqItems) maxParts.push(`faq:${filters.maxItems.faqItems}`);
    if (maxParts.length > 0) parts.push('max:' + maxParts.join('|'));
  }
  
  return parts.join(';') || 'default';
}

/**
 * Load KB data with signal-based filtering - Main entry point for Phase 3.2
 * @param businessContext - Normalized business context
 * @param auditAnswers - Raw audit responses for signal extraction
 * @param vertical - Business vertical (dental/hvac)
 * @param filters - Optional additional filters
 * @returns Complete KB result with metadata
 */
export function loadKBWithSignalTags(
  businessContext: BusinessContextNormalized,
  auditAnswers: Record<string, unknown>,
  vertical: 'dental' | 'hvac',
  filters?: KBFilter
): LoadKBResult {
  // Step 1: Extract signal tags from audit answers
  const signalTags = extractSignalTags(auditAnswers, vertical);
  
  // Step 2: Get KB sections for these signals
  const kbSections = getKBSectionsForTags(signalTags);
  
  // Step 3: Get extraction metrics for debugging
  const metrics = getSignalExtractionMetrics(auditAnswers, vertical);
  
  // Step 4: Apply anti-bloat limits
  const limitedKBSections = applyKBSectionLimits(kbSections, filters?.maxItems?.totalSections || 30);
  
  // Step 5: Load base KB and apply section filtering
  const baseKB = extractRelevantKB(businessContext);
  const filteredKB = applyKBSectionFiltering(baseKB, limitedKBSections, filters);
  
  // Step 6: Generate comprehensive filter signature
  const kbFilterSignature = generateKBFilterSignature(vertical, filters, signalTags, limitedKBSections);
  
  // Step 7: Log KB selection telemetry
  console.log(`KB Signal Filtering - Vertical: ${vertical}, Tags: ${signalTags.length}, Sections: ${limitedKBSections.length}`, {
    signalTags,
    kbSectionsSelected: limitedKBSections,
    metricsRulesMatched: metrics.rulesMatched,
    validationWarnings: metrics.validationWarnings
  });

  return {
    filteredKB,
    signalTags,
    kbSectionsSelected: limitedKBSections,
    kbFilterSignature,
    metrics
  };
}

/**
 * Apply priority-based limits to prevent prompt bloat
 * @param kbSections - Array of KB section IDs
 * @param maxSections - Maximum sections to include
 * @returns Limited and prioritized KB sections
 */
function applyKBSectionLimits(kbSections: string[], maxSections: number): string[] {
  if (kbSections.length <= maxSections) {
    return kbSections.sort();
  }

  // Priority order: skills > claims > benchmarks > faq > other
  const priorityOrder = ['skills.', 'claims.', 'benchmarks.', 'faq.'];
  const prioritized: string[] = [];
  
  // Add sections by priority
  for (const prefix of priorityOrder) {
    const matching = kbSections.filter(section => section.startsWith(prefix));
    prioritized.push(...matching);
    
    if (prioritized.length >= maxSections) {
      break;
    }
  }
  
  // Add any remaining sections if under limit
  const remaining = kbSections.filter(section => !prioritized.includes(section));
  prioritized.push(...remaining);
  
  // Apply final limit and sort for determinism
  return prioritized.slice(0, maxSections).sort();
}

/**
 * Apply KB section filtering to base KB payload - REAL IMPLEMENTATION
 * Maps section IDs to actual KB content and filters accordingly
 * @param baseKB - Base KB payload from extractRelevantKB
 * @param kbSections - Array of section IDs to include
 * @param filters - Additional filters to apply
 * @returns Filtered KB payload
 */
function applyKBSectionFiltering(
  baseKB: KBPayload, 
  kbSections: string[], 
  filters?: KBFilter
): KBPayload {
  // Create filtered copy
  let filteredKB: KBPayload = {
    brand: baseKB.brand, // Always include brand
    voiceSkills: [],
    painPoints: [],
    faq: [],
    pricing: baseKB.pricing || [], // Always include pricing
    responseModels: baseKB.responseModels, // Always include response models
    external: baseKB.external // Always include external sources
  };

  // If no sections specified, return empty filtered KB (except core data)
  if (!kbSections || kbSections.length === 0) {
    return filteredKB;
  }

  // Create section sets for efficient lookups
  const skillSections = new Set(kbSections.filter(id => id.startsWith('skills.')));
  const claimSections = new Set(kbSections.filter(id => id.startsWith('claims.')));
  const benchmarkSections = new Set(kbSections.filter(id => id.startsWith('benchmarks.')));
  const faqSections = new Set(kbSections.filter(id => id.startsWith('faq.')));

  // Filter Voice Skills based on skill sections
  if (baseKB.voiceSkills && skillSections.size > 0) {
    filteredKB.voiceSkills = baseKB.voiceSkills.filter(skill => {
      // Map skill to section ID based on skill name/tags
      const skillSectionId = mapSkillToSectionId(skill);
      return skillSectionId && skillSections.has(skillSectionId);
    });
  }

  // Filter Pain Points based on claim/benchmark sections
  if (baseKB.painPoints && (claimSections.size > 0 || benchmarkSections.size > 0)) {
    filteredKB.painPoints = baseKB.painPoints.filter(painPoint => {
      // Map pain point to section ID based on category/tags
      const painSectionIds = mapPainPointToSectionIds(painPoint);
      return painSectionIds.some(id => 
        claimSections.has(id) || benchmarkSections.has(id)
      );
    });
  }

  // Filter FAQ based on faq sections or related claims
  if (baseKB.faq && (faqSections.size > 0 || claimSections.size > 0)) {
    filteredKB.faq = baseKB.faq.filter(faqItem => {
      // Map FAQ to section ID based on category/tags
      const faqSectionIds = mapFAQToSectionIds(faqItem);
      return faqSectionIds.some(id => 
        faqSections.has(id) || claimSections.has(id)
      );
    });
  }

  // Apply additional category exclusions
  if (filters?.excludeCategories && filters.excludeCategories.length > 0) {
    if (filteredKB.painPoints) {
      filteredKB.painPoints = filteredKB.painPoints.filter(point => 
        !filters.excludeCategories!.some(cat => 
          point.category && point.category.includes(cat)
        )
      );
    }

    if (filteredKB.faq) {
      filteredKB.faq = filteredKB.faq.filter(item => 
        !filters.excludeCategories!.some(cat => 
          item.category && item.category.includes(cat)
        )
      );
    }
  }

  // Apply max item limits
  if (filters?.maxItems) {
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

  // Log filtering results for debugging
  console.log(`KB Filtering Applied - Sections: ${kbSections.length}, Skills: ${filteredKB.voiceSkills?.length || 0}, Pain Points: ${filteredKB.painPoints?.length || 0}, FAQ: ${filteredKB.faq?.length || 0}`);

  return filteredKB;
}

/**
 * Map voice skill to corresponding section ID
 * @param skill - Voice skill object from KB
 * @returns Section ID or null if no mapping found
 */
function mapSkillToSectionId(skill: any): string | null {
  if (!skill || !skill.name) return null;

  const skillName = skill.name.toLowerCase();
  const skillTags = skill.tags || [];

  // Map skill names to section IDs based on content
  if (skillName.includes('24/7') || skillName.includes('reception') || skillTags.includes('reception')) {
    return 'skills.reception_247';
  }
  if (skillName.includes('call handling') || skillName.includes('call management')) {
    return 'skills.call_handling';
  }
  if (skillName.includes('after hours') || skillName.includes('emergency')) {
    return 'skills.after_hours';
  }
  if (skillName.includes('no show') || skillName.includes('cancellation')) {
    return 'skills.prevention_no_show';
  }
  if (skillName.includes('reminder') || skillName.includes('follow up')) {
    return 'skills.reminders';
  }
  if (skillName.includes('waitlist') || skillName.includes('scheduling')) {
    return 'skills.waitlist_management';
  }
  if (skillName.includes('treatment plan') || skillName.includes('closer')) {
    return 'skills.treatment_plan_closer';
  }
  if (skillName.includes('follow up agent') || skillName.includes('follow-up')) {
    return 'skills.follow_up_agent';
  }
  if (skillName.includes('payment') || skillName.includes('financing')) {
    return 'skills.payment_options';
  }
  if (skillName.includes('dispatch') || skillName.includes('emergency')) {
    return 'skills.emergency_dispatch';
  }
  if (skillName.includes('job confirmation') || skillName.includes('appointment confirmation')) {
    return 'skills.job_confirmation';
  }
  if (skillName.includes('deposit') || skillName.includes('payment collection')) {
    return 'skills.deposit_collection';
  }
  if (skillName.includes('quote follow') || skillName.includes('estimate follow')) {
    return 'skills.quote_followup';
  }
  if (skillName.includes('contract') || skillName.includes('sales closer')) {
    return 'skills.contract_closer';
  }
  if (skillName.includes('objection') || skillName.includes('sales support')) {
    return 'skills.objection_handling';
  }
  if (skillName.includes('online scheduling') || skillName.includes('web scheduling')) {
    return 'skills.online_scheduling';
  }
  if (skillName.includes('website integration') || skillName.includes('web integration')) {
    return 'skills.website_integration';
  }
  if (skillName.includes('customer portal') || skillName.includes('client portal')) {
    return 'skills.customer_portal';
  }

  return null; // No mapping found
}

/**
 * Map pain point to corresponding section IDs
 * @param painPoint - Pain point object from KB
 * @returns Array of section IDs that relate to this pain point
 */
function mapPainPointToSectionIds(painPoint: any): string[] {
  if (!painPoint || !painPoint.problem) return [];

  const problem = painPoint.problem.toLowerCase();
  const category = painPoint.category?.toLowerCase() || '';
  const sectionIds: string[] = [];

  // Map based on problem content
  if (problem.includes('missed call') || problem.includes('unanswered call')) {
    sectionIds.push('claims.call_recovery_stats', 'benchmarks.call_response_time', 'benchmarks.call_capture_rate');
  }
  if (problem.includes('24/7') || problem.includes('after hours')) {
    sectionIds.push('claims.24_7_availability', 'claims.emergency_response');
  }
  if (problem.includes('no show') || problem.includes('cancellation')) {
    sectionIds.push('claims.no_show_reduction', 'claims.cancellation_reduction', 'benchmarks.no_show_industry');
  }
  if (problem.includes('revenue') || problem.includes('money') || problem.includes('loss')) {
    sectionIds.push('claims.revenue_protection');
  }
  if (problem.includes('treatment') || problem.includes('conversion')) {
    sectionIds.push('claims.treatment_conversion', 'claims.conversion_improvement', 'benchmarks.treatment_acceptance');
  }
  if (problem.includes('quote') || problem.includes('estimate')) {
    sectionIds.push('claims.quote_conversion', 'benchmarks.hvac_quote_close_rate');
  }
  if (problem.includes('online') || problem.includes('digital') || problem.includes('website')) {
    sectionIds.push('claims.booking_convenience', 'claims.digital_transformation', 'claims.digital_convenience');
  }
  if (problem.includes('competitive') || problem.includes('advantage')) {
    sectionIds.push('claims.competitive_advantage');
  }
  if (problem.includes('sales') || problem.includes('closing') || problem.includes('conversion')) {
    sectionIds.push('claims.sales_improvement');
  }
  if (problem.includes('digital convenience') || problem.includes('user experience')) {
    sectionIds.push('claims.digital_convenience');
  }
  if (problem.includes('industry standard') || problem.includes('acceptance rate')) {
    sectionIds.push('benchmarks.industry_acceptance_rates');
  }
  if (problem.includes('job completion') || problem.includes('completion rate')) {
    sectionIds.push('benchmarks.hvac_job_completion');
  }
  if (problem.includes('industry conversion') || category.includes('hvac')) {
    sectionIds.push('benchmarks.hvac_industry_conversion');
  }
  if (problem.includes('online booking') || problem.includes('digital adoption')) {
    sectionIds.push('benchmarks.online_booking_adoption', 'benchmarks.hvac_digital_adoption');
  }

  return sectionIds;
}

/**
 * Map FAQ item to corresponding section IDs
 * @param faqItem - FAQ item object from KB
 * @returns Array of section IDs that relate to this FAQ
 */
function mapFAQToSectionIds(faqItem: any): string[] {
  if (!faqItem || !faqItem.question) return [];

  const question = faqItem.question.toLowerCase();
  const answer = faqItem.answer?.toLowerCase() || '';
  const category = faqItem.category?.toLowerCase() || '';
  const sectionIds: string[] = [];

  // Map based on FAQ content
  if (question.includes('call') || answer.includes('call')) {
    sectionIds.push('claims.call_recovery_stats', 'claims.24_7_availability');
  }
  if (question.includes('appointment') || answer.includes('appointment')) {
    sectionIds.push('claims.no_show_reduction', 'claims.booking_convenience');
  }
  if (question.includes('treatment') || answer.includes('treatment')) {
    sectionIds.push('claims.treatment_conversion');
  }
  if (question.includes('quote') || answer.includes('quote')) {
    sectionIds.push('claims.quote_conversion');
  }
  if (question.includes('online') || question.includes('digital')) {
    sectionIds.push('claims.digital_transformation', 'claims.booking_convenience');
  }
  if (question.includes('emergency') || answer.includes('emergency')) {
    sectionIds.push('claims.emergency_response', 'claims.24_7_availability');
  }
  if (question.includes('sales') || answer.includes('conversion')) {
    sectionIds.push('claims.sales_improvement');
  }
  if (question.includes('digital convenience') || answer.includes('user experience')) {
    sectionIds.push('claims.digital_convenience');
  }
  if (question.includes('industry') || answer.includes('benchmark')) {
    sectionIds.push('benchmarks.industry_acceptance_rates', 'benchmarks.hvac_industry_conversion');
  }
  if (question.includes('completion') || answer.includes('job completion')) {
    sectionIds.push('benchmarks.hvac_job_completion');
  }
  if (question.includes('digital adoption') || answer.includes('online booking')) {
    sectionIds.push('benchmarks.online_booking_adoption', 'benchmarks.hvac_digital_adoption');
  }

  return sectionIds;
}

/**
 * Gets KB data optimized for AI prompt generation (legacy function)
 * @deprecated Use loadKBWithSignalTags for signal-based filtering
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

/**
 * Initialize and validate KB bindings at startup
 * @returns Validation result for KB_BINDINGS integrity
 */
export function initializeKBValidation(): {
  isValid: boolean;
  warnings: string[];
  missingSections: string[];
} {
  // Mock available KB sections - in production, this would come from actual KB
  const availableKBSections = [
    'skills.reception_247', 'skills.call_handling', 'skills.after_hours',
    'skills.prevention_no_show', 'skills.reminders', 'skills.waitlist_management',
    'skills.treatment_plan_closer', 'skills.follow_up_agent', 'skills.payment_options',
    'skills.emergency_dispatch', 'skills.job_confirmation', 'skills.deposit_collection',
    'skills.quote_followup', 'skills.contract_closer', 'skills.objection_handling',
    'skills.online_scheduling', 'skills.website_integration', 'skills.customer_portal',
    'claims.call_recovery_stats', 'claims.24_7_availability', 'claims.emergency_response',
    'claims.no_show_reduction', 'claims.revenue_protection', 'claims.treatment_conversion',
    'claims.cancellation_reduction', 'claims.quote_conversion', 'claims.conversion_improvement',
    'claims.sales_improvement', 'claims.booking_convenience', 'claims.digital_transformation',
    'claims.digital_convenience', 'claims.competitive_advantage',
    'benchmarks.call_response_time', 'benchmarks.call_capture_rate', 'benchmarks.call_response_hvac',
    'benchmarks.hvac_call_capture', 'benchmarks.appointment_confirmation', 'benchmarks.no_show_industry',
    'benchmarks.hvac_job_completion', 'benchmarks.treatment_acceptance', 'benchmarks.industry_acceptance_rates',
    'benchmarks.hvac_quote_close_rate', 'benchmarks.hvac_industry_conversion', 'benchmarks.online_booking_adoption',
    'benchmarks.hvac_digital_adoption'
  ];
  
  const validation = validateKBBindings(availableKBSections);
  
  if (validation.warnings.length > 0) {
    console.warn('KB_BINDINGS validation warnings:', validation.warnings);
  }
  
  return validation;
}