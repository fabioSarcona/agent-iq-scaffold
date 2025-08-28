// Knowledge Base access helpers for NeedAgentIQ

export interface KBService {
  name: string;
  target: 'Dental' | 'HVAC' | 'Both';
  problem: string;
  how: string;
  roiRangeMonthly?: [number, number];
  tags?: string[];
}

export interface KBSlice {
  approved_claims: string[];
  services: KBService[];
  brand?: {
    name: string;
    tagline: string;
    values: string[];
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
 * Get services relevant to a specific problem area
 */
export function getRelevantServices(
  services: KBService[], 
  vertical: 'dental' | 'hvac', 
  problemTags?: string[]
): KBService[] {
  let filtered = filterServicesByVertical(services, vertical);
  
  if (problemTags && problemTags.length > 0) {
    filtered = filterServicesByTags(filtered, problemTags);
  }
  
  return filtered;
}

/**
 * Create KB slice for NeedAgentIQ processing
 */
export function createKBSlice(
  fullKB: any,
  vertical: 'dental' | 'hvac',
  relevantTags?: string[]
): KBSlice {
  const services = fullKB?.voice || [];
  
  return {
    approved_claims: fullKB?.faq?.approvedClaims || [],
    services: getRelevantServices(services, vertical, relevantTags),
    brand: fullKB?.brand ? {
      name: fullKB.brand.name || 'NeedAgent.AI',
      tagline: fullKB.brand.tagline || '',
      values: fullKB.brand.values || []
    } : undefined
  };
}