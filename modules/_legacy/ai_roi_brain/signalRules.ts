// Signal Rules Module - Deterministic Signal Tag Extraction for ROI Brain
// Maps audit answers to specific signal tags that determine KB section loading

import type { BusinessContextNormalized } from './businessExtractor.ts';

// Version for cache invalidation
export const SIGNAL_RULES_VERSION = 'v1.0';

// Centralized thresholds to avoid magic strings
export const THRESHOLDS = {
  MISSED_CALLS_MEDIUM: 4,
  MISSED_CALLS_HIGH: 11,
  NO_SHOWS_HIGH: 7,
  NO_SHOWS_CRITICAL: 11,
  COLD_PLANS_HIGH: 10,
  PENDING_QUOTES_HIGH: 20,
  TREATMENT_ACCEPTANCE_LOW: 40,
  QUOTE_ACCEPTANCE_LOW: 3,
} as const;

// Valid audit answer domains for validation
export const VALID_DOMAINS = {
  daily_unanswered_calls_choice: ['0', '1_3', '4_10', '11_20', '21_plus'],
  hvac_daily_unanswered_calls_choice: ['none', '1_3', '4_6', 'gt_6'],
  weekly_no_shows_choice: ['0', '1_3', '4_6', '7_10', '11_plus'],
  weekly_job_cancellations_choice: ['none', '1_2', '3_5', 'gt_5'],
  website_scheduling_connection_choice: ['full', 'partial', 'not_connected', 'no_website'],
  website_system_connection_choice: ['full', 'partial', 'not_connected', 'no_website'],
  treatment_acceptance_rate_choice: ['lt_30', '30_60', '60_80', 'gt_80'],
  immediate_quote_acceptance_choice: ['0_2', '3_5', '6_10'],
} as const;

// Signal extraction rules - deterministic mapping
export const SIGNAL_RULES: Array<{
  when: (answers: Record<string, unknown>, vertical: string) => boolean;
  add: string[];
}> = [
  // === MISSED CALLS SIGNALS ===
  {
    when: (a, v) => v === 'dental' && a.daily_unanswered_calls_choice === '4_10',
    add: ['missed_calls_medium']
  },
  {
    when: (a, v) => v === 'dental' && ['11_20', '21_plus'].includes(String(a.daily_unanswered_calls_choice)),
    add: ['missed_calls_high']
  },
  {
    when: (a, v) => v === 'hvac' && ['1_3', '4_6'].includes(String(a.hvac_daily_unanswered_calls_choice)),
    add: ['missed_calls_medium']
  },
  {
    when: (a, v) => v === 'hvac' && a.hvac_daily_unanswered_calls_choice === 'gt_6',
    add: ['missed_calls_high']
  },

  // === NO SHOWS / CANCELLATIONS SIGNALS ===
  {
    when: (a, v) => v === 'dental' && a.weekly_no_shows_choice === '7_10',
    add: ['no_shows_high']
  },
  {
    when: (a, v) => v === 'dental' && a.weekly_no_shows_choice === '11_plus',
    add: ['no_shows_critical']
  },
  {
    when: (a, v) => v === 'hvac' && ['3_5', 'gt_5'].includes(String(a.weekly_job_cancellations_choice)),
    add: ['job_cancellations_high']
  },

  // === TREATMENT PLANS / QUOTES SIGNALS ===
  {
    when: (a, v) => v === 'dental' && Number(a.monthly_cold_treatment_plans) > THRESHOLDS.COLD_PLANS_HIGH,
    add: ['treatment_plans_high']
  },
  {
    when: (a, v) => v === 'dental' && ['lt_30', '30_60'].includes(String(a.treatment_acceptance_rate_choice)),
    add: ['treatment_conversion_low']
  },
  {
    when: (a, v) => v === 'hvac' && Number(a.monthly_pending_quotes) > THRESHOLDS.PENDING_QUOTES_HIGH,
    add: ['quotes_pending_high']
  },
  {
    when: (a, v) => v === 'hvac' && ['0_2', '3_5'].includes(String(a.immediate_quote_acceptance_choice)),
    add: ['quote_conversion_low']
  },

  // === TECHNOLOGY GAP SIGNALS ===
  {
    when: (a, v) => v === 'dental' && ['not_connected', 'no_website'].includes(String(a.website_scheduling_connection_choice)),
    add: ['no_online_booking']
  },
  {
    when: (a, v) => v === 'hvac' && ['not_connected', 'no_website'].includes(String(a.website_system_connection_choice)),
    add: ['no_online_booking']
  },
];

// KB section bindings - map signal tags to specific KB sections
export const KB_BINDINGS: Record<string, string[]> = {
  // Missed calls signals → call handling solutions
  'dental.missed_calls_medium': [
    'skills.reception_247',
    'skills.call_handling',
    'claims.call_recovery_stats',
    'benchmarks.call_response_time'
  ],
  'dental.missed_calls_high': [
    'skills.reception_247',
    'skills.call_handling',
    'skills.after_hours',
    'claims.call_recovery_stats',
    'claims.24_7_availability',
    'benchmarks.call_capture_rate'
  ],
  'hvac.missed_calls_medium': [
    'skills.reception_247',
    'skills.emergency_dispatch',
    'claims.call_recovery_stats',
    'benchmarks.call_response_hvac'
  ],
  'hvac.missed_calls_high': [
    'skills.reception_247',
    'skills.emergency_dispatch',
    'skills.after_hours',
    'claims.emergency_response',
    'claims.24_7_availability',
    'benchmarks.hvac_call_capture'
  ],

  // No shows / cancellations → prevention and management
  'dental.no_shows_high': [
    'skills.prevention_no_show',
    'skills.reminders',
    'claims.no_show_reduction',
    'benchmarks.appointment_confirmation'
  ],
  'dental.no_shows_critical': [
    'skills.prevention_no_show',
    'skills.reminders',
    'skills.waitlist_management',
    'claims.no_show_reduction',
    'claims.revenue_protection',
    'benchmarks.no_show_industry'
  ],
  'hvac.job_cancellations_high': [
    'skills.job_confirmation',
    'skills.reminders',
    'skills.deposit_collection',
    'claims.cancellation_reduction',
    'benchmarks.hvac_job_completion'
  ],

  // Treatment plans / quotes → sales support
  'dental.treatment_plans_high': [
    'skills.treatment_plan_closer',
    'skills.follow_up_agent',
    'claims.treatment_conversion',
    'benchmarks.treatment_acceptance'
  ],
  'dental.treatment_conversion_low': [
    'skills.treatment_plan_closer',
    'skills.payment_options',
    'claims.conversion_improvement',
    'benchmarks.industry_acceptance_rates'
  ],
  'hvac.quotes_pending_high': [
    'skills.quote_followup',
    'skills.contract_closer',
    'claims.quote_conversion',
    'benchmarks.hvac_quote_close_rate'
  ],
  'hvac.quote_conversion_low': [
    'skills.quote_followup',
    'skills.objection_handling',
    'claims.sales_improvement',
    'benchmarks.hvac_industry_conversion'
  ],

  // Technology gaps → digital solutions
  'dental.no_online_booking': [
    'skills.online_scheduling',
    'skills.website_integration',
    'claims.booking_convenience',
    'claims.digital_transformation',
    'benchmarks.online_booking_adoption'
  ],
  'hvac.no_online_booking': [
    'skills.online_scheduling',
    'skills.customer_portal',
    'claims.digital_convenience',
    'claims.competitive_advantage',
    'benchmarks.hvac_digital_adoption'
  ],
};

/**
 * Extract signal tags from audit answers - deterministic and cache-friendly
 * @param auditAnswers - Raw audit response data
 * @param vertical - Business vertical (dental/hvac)
 * @returns Array of namespaced signal tags
 */
export function extractSignalTags(
  auditAnswers: Record<string, unknown>, 
  vertical: 'dental' | 'hvac'
): string[] {
  if (!auditAnswers || typeof auditAnswers !== 'object') {
    return [];
  }

  const signals = new Set<string>();

  // Apply each rule and collect matching signals
  for (const rule of SIGNAL_RULES) {
    try {
      if (rule.when(auditAnswers, vertical)) {
        rule.add.forEach(tag => signals.add(tag));
      }
    } catch (error) {
      // Graceful degradation - log warning but continue
      console.warn(`Signal rule evaluation failed:`, error, rule);
    }
  }

  // Apply vertical namespace and return sorted array for determinism
  return Array.from(signals)
    .map(tag => `${vertical}.${tag}`)
    .sort();
}

/**
 * Get KB sections for given signal tags
 * @param signalTags - Array of namespaced signal tags
 * @returns Array of unique KB section IDs
 */
export function getKBSectionsForTags(signalTags: string[]): string[] {
  const sections = new Set<string>();

  signalTags.forEach(tag => {
    const kbSections = KB_BINDINGS[tag];
    if (kbSections && Array.isArray(kbSections)) {
      kbSections.forEach(section => sections.add(section));
    } else {
      // Warning for missing binding, but don't crash
      console.warn(`KB_BINDINGS missing for signal tag: ${tag}`);
    }
  });

  // Return sorted array for determinism
  return Array.from(sections).sort();
}

/**
 * Validate signal tags against known patterns
 * @param signalTags - Array of signal tags to validate
 * @returns Validation result with any issues found
 */
export function validateSignalTags(signalTags: string[]): {
  isValid: boolean;
  warnings: string[];
  unknownTags: string[];
} {
  const warnings: string[] = [];
  const unknownTags: string[] = [];

  signalTags.forEach(tag => {
    if (!KB_BINDINGS[tag]) {
      unknownTags.push(tag);
      warnings.push(`Unknown signal tag: ${tag}`);
    }
  });

  return {
    isValid: unknownTags.length === 0,
    warnings,
    unknownTags
  };
}

/**
 * Validate KB_BINDINGS against available KB sections
 * Called once at startup to ensure data integrity
 * @param availableKBSections - Array of available KB section IDs
 * @returns Validation result
 */
export function validateKBBindings(availableKBSections: string[]): {
  isValid: boolean;
  warnings: string[];
  missingSections: string[];
} {
  const warnings: string[] = [];
  const missingSections = new Set<string>();
  const availableSections = new Set(availableKBSections);

  // Check each binding for missing sections
  Object.entries(KB_BINDINGS).forEach(([signalTag, sections]) => {
    sections.forEach(sectionId => {
      if (!availableSections.has(sectionId)) {
        missingSections.add(sectionId);
        warnings.push(`Signal tag '${signalTag}' references missing KB section: ${sectionId}`);
      }
    });
  });

  return {
    isValid: missingSections.size === 0,
    warnings,
    missingSections: Array.from(missingSections).sort()
  };
}

/**
 * Get comprehensive signal extraction metrics for debugging
 * @param auditAnswers - Audit answers to analyze
 * @param vertical - Business vertical
 * @returns Extraction metrics and debug info
 */
export function getSignalExtractionMetrics(
  auditAnswers: Record<string, unknown>,
  vertical: 'dental' | 'hvac'
): {
  signalTags: string[];
  kbSections: string[];
  rulesMatched: number;
  totalRules: number;
  validationWarnings: string[];
} {
  const signalTags = extractSignalTags(auditAnswers, vertical);
  const kbSections = getKBSectionsForTags(signalTags);
  const validation = validateSignalTags(signalTags);
  
  // Count how many rules matched
  let rulesMatched = 0;
  SIGNAL_RULES.forEach(rule => {
    try {
      if (rule.when(auditAnswers, vertical)) {
        rulesMatched++;
      }
    } catch (error) {
      // Silent catch for metrics
    }
  });

  return {
    signalTags,
    kbSections,
    rulesMatched,
    totalRules: SIGNAL_RULES.length,
    validationWarnings: validation.warnings
  };
}