// Client-side Knowledge Base access helpers

import { services, approved_claims } from '@/kb';

export interface KBService {
  name: string;
  target: 'Dental' | 'HVAC' | 'Both';
  problem: string;
  how: string;
  roiRangeMonthly?: [number, number];
  tags?: string[];
}

export interface KBSlice {
  services: readonly KBService[];
  approved_claims: readonly string[];
}

/**
 * Filter services by vertical (auditType)
 */
export function filterServicesByVertical(services: readonly KBService[], vertical: 'dental' | 'hvac'): KBService[] {
  const targetMap = { dental: 'Dental', hvac: 'HVAC' } as const;
  const target = targetMap[vertical];
  
  return services.filter(service => 
    service.target === target || service.target === 'Both'
  );
}

/**
 * Get KB slices filtered by vertical for AI payloads
 */
export function getKBSlicesForVertical(vertical: 'dental' | 'hvac'): KBSlice {
  return {
    services: filterServicesByVertical(services, vertical),
    approved_claims
  };
}