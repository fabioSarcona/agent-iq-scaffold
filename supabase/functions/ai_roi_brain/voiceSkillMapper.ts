// Voice Skill Mapper Module (FASE 4)
// Maps pain points and audit sections to specific AI voice skills
// NOW IMPLEMENTED - Uses deterministic mapping from voiceSkillMapping.ts

import { 
  buildNeedAgentIQInsights, 
  mapSignalTagsToSkills, 
  mapSectionsToSkills as mapMoneyLostSectionsToSkills,
  VOICE_SKILL_MAPPING_VERSION,
  validateSkillMapping,
  type SkillInsight
} from './voiceSkillMapping.ts';

export interface VoiceSkillMapping {
  painPoint: string;
  sectionId: string;
  recommendedSkills: string[];
  priority: 'high' | 'medium' | 'low';
  rationale: string;
}

/**
 * Maps pain points to recommended voice skills (FASE 4 - IMPLEMENTED)
 * @param painPoints - Array of identified pain points
 * @param vertical - Business vertical (dental/hvac)
 * @param businessSize - Business size classification
 * @returns Array of voice skill mappings
 */
export function mapPainPointsToSkills(
  painPoints: string[],
  vertical: 'dental' | 'hvac',
  businessSize: 'small' | 'medium' | 'large'
): VoiceSkillMapping[] {
  // Convert to new format and generate insights
  const painPointObjects = painPoints.map(p => ({ id: p }));
  const insights = buildNeedAgentIQInsights({
    signalTags: [],
    painPoints: painPointObjects,
    moneyLostByArea: {},
    vertical,
    businessSize
  });
  
  // Convert insights back to legacy format for backward compatibility
  return insights.map(insight => ({
    painPoint: insight.metadata.painPointId || 'unknown',
    sectionId: insight.category,
    recommendedSkills: [insight.metadata.skillId],
    priority: insight.priority,
    rationale: insight.description
  }));
}

/**
 * Maps audit sections to voice skills (FASE 4 - IMPLEMENTED)
 * @param sections - Audit sections with scores  
 * @param vertical - Business vertical
 * @returns Section-based skill recommendations
 */
export function mapSectionsToSkills(
  sections: Array<{ sectionId?: string; name?: string; score: number }>,
  vertical: 'dental' | 'hvac'
): VoiceSkillMapping[] {
  // Focus on low-scoring sections (below 60) as they indicate problems
  const lowScoringSections = sections.filter(s => s.score < 60);
  
  if (lowScoringSections.length === 0) {
    return [];
  }
  
  // Create mock money lost data for sections (would normally come from MoneyLost calculation)
  const moneyLostByArea: Record<string, number> = {};
  lowScoringSections.forEach(section => {
    const sectionName = section.name || section.sectionId || 'Unknown';
    // Estimate loss based on score (lower score = higher estimated loss)
    const estimatedLoss = Math.round((100 - section.score) * 100); // $100 per missing point
    moneyLostByArea[sectionName] = estimatedLoss;
  });
  
  const insights = buildNeedAgentIQInsights({
    signalTags: [],
    painPoints: [],
    moneyLostByArea,
    vertical,
    businessSize: 'medium' // Default business size
  });
  
  // Convert insights back to legacy format
  return insights.map(insight => ({
    painPoint: insight.category,
    sectionId: lowScoringSections.find(s => s.name && insight.impact.includes(s.name))?.sectionId || 'unknown',
    recommendedSkills: [insight.metadata.skillId],
    priority: insight.priority,
    rationale: insight.description
  }));
}

/**
 * Generate NeedAgentIQ insights for ROI Brain integration (NEW)
 * @param input - Complete business context and signal data
 * @returns Array of formatted insights for NeedAgentIQ UI
 */
export function generateNeedAgentIQInsights(input: {
  signalTags: string[];
  painPoints?: Array<{ id: string; monthlyImpact?: number }>;
  moneyLostByArea: Record<string, number>;
  vertical: 'dental' | 'hvac';
  businessSize: 'small' | 'medium' | 'large';
}): Array<{
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  rationale: string[];
  monthlyImpactUsd: number;
  actionable: boolean;
}> {
  const insights = buildNeedAgentIQInsights(input);
  
  // Convert to NeedAgentIQ format expected by outputDistributor.ts
  return insights.map(insight => ({
    title: insight.title,
    description: insight.description,
    impact: insight.priority, // Map priority to impact for UI
    priority: insight.priority,
    category: insight.category,
    rationale: [
      insight.impact, // Use impact description as rationale
      `Confidence: ${insight.confidence}%`,
      `Sources: ${insight.metadata.sources.join(', ')}`
    ],
    monthlyImpactUsd: insight.monthlyImpactUsd,
    actionable: insight.actionable
  }));
}

/**
 * Get version info for cache invalidation
 */
export function getVoiceSkillMapperVersion(): string {
  return VOICE_SKILL_MAPPING_VERSION;
}

/**
 * Validate mapping configuration at startup
 */
export function validateVoiceSkillMapper(): {
  isValid: boolean;
  warnings: string[];
} {
  const validation = validateSkillMapping();
  
  if (!validation.isValid) {
    console.warn('Voice Skill Mapping validation failed:', validation.warnings);
  }
  
  console.log(`Voice Skill Mapper v${VOICE_SKILL_MAPPING_VERSION} - Validation ${validation.isValid ? 'PASSED' : 'FAILED'}`);
  
  return {
    isValid: validation.isValid,
    warnings: validation.warnings
  };
}