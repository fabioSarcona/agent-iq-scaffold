// Knowledge Base Helper Functions with Lazy Loading
// Provides access to KB data for Edge Functions with minimal memory usage

export interface VoiceSkill {
  name: string;
  target: 'Dental' | 'HVAC' | 'Both';
  painPoint: string;
  howItWorks: string;
  estimatedROI: string;
  monthlyPrice: number;
  includedIn: string[];
}

export interface PainPoint {
  id: string;
  title: string;
  impact: string;
  solution: string;
  source: string;
  category: string;
  monthlyImpact: number;
}

export interface Service {
  name: string;
  target: 'Both' | 'Dental' | 'HVAC';
  problem: string;
  how: string;
  roiRangeMonthly: [number, number];
  tags: string[];
}

// Individual caches for each KB section with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Individual caches for each data type
const caches = {
  approvedClaims: null as CacheEntry<string[]> | null,
  services: null as CacheEntry<Service[]> | null,
  voiceSkills: null as CacheEntry<any> | null,
  painPoints: null as CacheEntry<any> | null,
  brand: null as CacheEntry<any> | null,
  externalSources: null as CacheEntry<any> | null,
  responseModels: null as CacheEntry<any> | null,
  faq: null as CacheEntry<any> | null,
  pricing: null as CacheEntry<any> | null,
  aiTechnology: null as CacheEntry<any> | null
};

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to check if cache entry is valid
function isCacheValid<T>(entry: CacheEntry<T> | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < entry.ttl;
}

// Lazy loaders for individual KB sections
async function loadApprovedClaims(): Promise<string[]> {
  if (isCacheValid(caches.approvedClaims)) {
    return caches.approvedClaims!.data;
  }
  
  const text = await Deno.readTextFile(new URL('./approved_claims.json', import.meta.url));
  const data = JSON.parse(text);
  
  caches.approvedClaims = {
    data,
    timestamp: Date.now(),
    ttl: DEFAULT_TTL
  };
  
  return data;
}

async function loadServices(): Promise<Service[]> {
  if (isCacheValid(caches.services)) {
    return caches.services!.data;
  }
  
  const text = await Deno.readTextFile(new URL('./services.json', import.meta.url));
  const data = JSON.parse(text);
  
  caches.services = {
    data,
    timestamp: Date.now(),
    ttl: DEFAULT_TTL
  };
  
  return data;
}

async function loadVoiceSkills(): Promise<any> {
  if (isCacheValid(caches.voiceSkills)) {
    return caches.voiceSkills!.data;
  }
  
  const text = await Deno.readTextFile(new URL('./voice_skills.json', import.meta.url));
  const data = JSON.parse(text);
  
  caches.voiceSkills = {
    data,
    timestamp: Date.now(),
    ttl: DEFAULT_TTL
  };
  
  return data;
}

async function loadPainPoints(): Promise<any> {
  if (isCacheValid(caches.painPoints)) {
    return caches.painPoints!.data;
  }
  
  const text = await Deno.readTextFile(new URL('./pain_points.json', import.meta.url));
  const data = JSON.parse(text);
  
  caches.painPoints = {
    data,
    timestamp: Date.now(),
    ttl: DEFAULT_TTL
  };
  
  return data;
}

async function loadBrand(): Promise<any> {
  if (isCacheValid(caches.brand)) {
    return caches.brand!.data;
  }
  
  const text = await Deno.readTextFile(new URL('./brand.json', import.meta.url));
  const data = JSON.parse(text);
  
  caches.brand = {
    data,
    timestamp: Date.now(),
    ttl: DEFAULT_TTL
  };
  
  return data;
}

async function loadFAQ(): Promise<any> {
  if (isCacheValid(caches.faq)) {
    return caches.faq!.data;
  }
  
  const text = await Deno.readTextFile(new URL('./faq.json', import.meta.url));
  const data = JSON.parse(text);
  
  caches.faq = {
    data,
    timestamp: Date.now(),
    ttl: DEFAULT_TTL
  };
  
  return data;
}

async function loadPricing(): Promise<any> {
  if (isCacheValid(caches.pricing)) {
    return caches.pricing!.data;
  }
  
  const text = await Deno.readTextFile(new URL('./pricing.json', import.meta.url));
  const data = JSON.parse(text);
  
  caches.pricing = {
    data,
    timestamp: Date.now(),
    ttl: DEFAULT_TTL
  };
  
  return data;
}

// Legacy function for backward compatibility - now loads incrementally
export async function getKBData() {
  // Load only basic structure, not all data
  return {
    approved_claims: [], // Load on demand
    services: [], // Load on demand
    voiceSkills: { dental: [], hvac: [] }, // Load on demand
    painPoints: { dental: [], hvac: [] }, // Load on demand
    brand: {}, // Load on demand
    externalSources: {}, // Load on demand
    responseModels: {}, // Load on demand
    faq: [], // Load on demand
    pricing: [], // Load on demand
    aiTechnology: {} // Load on demand
  };
}

// Helper functions using lazy loaders - only load needed data
export async function getAllVoiceSkills(): Promise<VoiceSkill[]> {
  const voiceSkills = await loadVoiceSkills();
  return [...voiceSkills.dental, ...voiceSkills.hvac];
}

export async function getSkillsByTarget(target: 'Dental' | 'HVAC'): Promise<VoiceSkill[]> {
  const voiceSkills = await loadVoiceSkills();
  const skills = target === 'Dental' ? voiceSkills.dental : voiceSkills.hvac;
  return skills.filter((skill: VoiceSkill) => skill.target === target || skill.target === 'Both');
}

export async function getPainPointsByVertical(vertical: 'dental' | 'hvac'): Promise<PainPoint[]> {
  const painPoints = await loadPainPoints();
  return painPoints[vertical] || [];
}

export async function getAllPainPoints(): Promise<PainPoint[]> {
  const painPoints = await loadPainPoints();
  return [...(painPoints.dental || []), ...(painPoints.hvac || [])];
}

export async function getServicesByTarget(target: 'Dental' | 'HVAC'): Promise<Service[]> {
  const services = await loadServices();
  return services.filter((service: Service) => service.target === target || service.target === 'Both');
}

export async function getApprovedClaims(): Promise<string[]> {
  return await loadApprovedClaims();
}

// Export for compatibility with existing code
export const painPoints = {
  async dental() {
    return await getPainPointsByVertical('dental');
  },
  async hvac() {
    return await getPainPointsByVertical('hvac');
  }
};