// Knowledge Base validation and access helpers
import { z } from "https://esm.sh/zod@3.22.4";
import { KBServiceSchema, KBCaseStudySchema } from './validation.ts';

// KB slice validation schema
export const KBSliceSchema = z.object({
  approved_claims: z.array(z.string()),
  services: z.array(KBServiceSchema),
  case_studies: z.array(KBCaseStudySchema).optional()
});

export type KBSlice = z.infer<typeof KBSliceSchema>;
export type KBService = z.infer<typeof KBServiceSchema>;
export type KBCaseStudy = z.infer<typeof KBCaseStudySchema>;

/**
 * Validate KB slice from request payload
 */
export function validateKBSlice(kb: unknown): KBSlice {
  return KBSliceSchema.parse(kb);
}

/**
 * Filter services by vertical (auditType)
 */
export function filterServicesByVertical(services: KBService[], vertical: 'dental' | 'hvac'): KBService[] {
  const targetMap = { dental: 'Dental', hvac: 'HVAC' } as const;
  const target = targetMap[vertical];
  
  return services.filter(service => 
    service.target === target || service.target === 'Both'
  );
}

/**
 * Filter services by tags
 */
export function filterServicesByTags(services: KBService[], tags: string[]): KBService[] {
  if (tags.length === 0) return services;
  
  return services.filter(service => 
    service.tags?.some(tag => tags.includes(tag))
  );
}

/**
 * Find service by name
 */
export function findServiceByName(services: KBService[], name: string): KBService | undefined {
  return services.find(service => service.name === name);
}

/**
 * Validate that a skill exists in the KB for the given vertical
 */
export function validateSkillForVertical(
  kb: KBSlice, 
  skillName: string, 
  vertical: 'dental' | 'hvac'
): boolean {
  const targetMap = { dental: 'Dental', hvac: 'HVAC' } as const;
  const target = targetMap[vertical];
  
  return kb.services.some(service => 
    service.name === skillName && 
    (service.target === target || service.target === 'Both')
  );
}

/**
 * Get case studies for a specific skill and vertical
 */
export function getCaseStudiesForSkill(
  kb: KBSlice, 
  skillName: string, 
  vertical: 'dental' | 'hvac'
): KBCaseStudy[] {
  if (!kb.case_studies) return [];
  
  const targetMap = { dental: 'Dental', hvac: 'HVAC' } as const;
  const target = targetMap[vertical];
  
  return kb.case_studies.filter(study => 
    study.skillName === skillName && study.vertical === target
  );
}