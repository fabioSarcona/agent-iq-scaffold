// Knowledge Base validation and access helpers
import { z } from "https://esm.sh/zod@3.22.4";

// Simplified KB types to avoid deep type instantiation
export interface KBService {
  id?: string;
  name: string;
  target: "Dental" | "HVAC" | "Both";
  problem: string;
  how: string;
  roiRangeMonthly?: [number, number];
  tags?: string[];
  areaId?: string;
}

export interface KBCaseStudy {
  skillName: string;
  vertical: "Dental" | "HVAC";
  metric: string;
  timeframe?: string;
}

export interface KBSlice {
  approved_claims: string[];
  services: KBService[];
  case_studies?: KBCaseStudy[];
}

/**
 * Validate KB slice from request payload
 */
export function validateKBSlice(kb: unknown): KBSlice {
  // Simple runtime validation without complex schemas
  const data = kb as any;
  return {
    approved_claims: Array.isArray(data?.approved_claims) ? data.approved_claims : [],
    services: Array.isArray(data?.services) ? data.services : [],
    case_studies: Array.isArray(data?.case_studies) ? data.case_studies : undefined
  };
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