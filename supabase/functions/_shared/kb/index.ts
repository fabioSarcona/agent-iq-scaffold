// Knowledge Base Helper Functions
// Provides access to all KB data for Edge Functions

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

// Load KB data from JSON files
async function loadKBData() {
  const [
    approvedClaimsText,
    servicesText,
    voiceSkillsText,
    painPointsText,
    brandText,
    externalSourcesText,
    responseModelsText,
    faqText,
    pricingText,
    aiTechnologyText
  ] = await Promise.all([
    Deno.readTextFile(new URL('./approved_claims.json', import.meta.url)),
    Deno.readTextFile(new URL('./services.json', import.meta.url)),
    Deno.readTextFile(new URL('./voice_skills.json', import.meta.url)),
    Deno.readTextFile(new URL('./pain_points.json', import.meta.url)),
    Deno.readTextFile(new URL('./brand.json', import.meta.url)),
    Deno.readTextFile(new URL('./external_sources.json', import.meta.url)),
    Deno.readTextFile(new URL('./response_models.json', import.meta.url)),
    Deno.readTextFile(new URL('./faq.json', import.meta.url)),
    Deno.readTextFile(new URL('./pricing.json', import.meta.url)),
    Deno.readTextFile(new URL('./ai_technology.json', import.meta.url))
  ]);

  return {
    approved_claims: JSON.parse(approvedClaimsText),
    services: JSON.parse(servicesText),
    voiceSkills: JSON.parse(voiceSkillsText),
    painPoints: JSON.parse(painPointsText),
    brand: JSON.parse(brandText),
    externalSources: JSON.parse(externalSourcesText),
    responseModels: JSON.parse(responseModelsText),
    faq: JSON.parse(faqText),
    pricing: JSON.parse(pricingText),
    aiTechnology: JSON.parse(aiTechnologyText)
  };
}

// Cache KB data to avoid repeated file reads
let kbCache: any = null;

export async function getKBData() {
  if (!kbCache) {
    kbCache = await loadKBData();
  }
  return kbCache;
}

// Helper functions matching frontend KB interface
export async function getAllVoiceSkills(): Promise<VoiceSkill[]> {
  const kb = await getKBData();
  return [...kb.voiceSkills.dental, ...kb.voiceSkills.hvac];
}

export async function getSkillsByTarget(target: 'Dental' | 'HVAC'): Promise<VoiceSkill[]> {
  const allSkills = await getAllVoiceSkills();
  return allSkills.filter(skill => skill.target === target || skill.target === 'Both');
}

export async function getPainPointsByVertical(vertical: 'dental' | 'hvac'): Promise<PainPoint[]> {
  const kb = await getKBData();
  return kb.painPoints[vertical] || [];
}

export async function getAllPainPoints(): Promise<PainPoint[]> {
  const kb = await getKBData();
  return [...(kb.painPoints.dental || []), ...(kb.painPoints.hvac || [])];
}

export async function getServicesByTarget(target: 'Dental' | 'HVAC'): Promise<Service[]> {
  const kb = await getKBData();
  return kb.services.filter((service: Service) => service.target === target || service.target === 'Both');
}

export async function getApprovedClaims(): Promise<string[]> {
  const kb = await getKBData();
  return kb.approved_claims;
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