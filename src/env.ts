import { z } from 'zod';

const schema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(10),
  // Feature Flags for Single Brain Rollout
  VITE_ENABLE_ROI_BRAIN: z.string().optional().default('false'),
  VITE_ROI_BRAIN_ROLLOUT_PCT: z.string().optional().default('0'),
  // Granular ROI Brain Feature Flags
  VITE_ROIBRAIN_NEEDAGENTIQ_ENABLED: z.string().optional().default('false'),
  VITE_ROIBRAIN_SKILLSCOPE_ENABLED: z.string().optional().default('false'),
  VITE_ROIBRAIN_FULL_INTEGRATION_ENABLED: z.string().optional().default('false'),
  // FASE 4.3: Money Lost Data Strict Mode
  VITE_ROIBRAIN_MONEYLOST_STRICT: z.string().optional().default('false'),
  // PLAN D: Timeout Configuration
  VITE_REPORT_TIMEOUT_MS: z.string().optional().default('45000'),
});

const parsed = schema.parse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_ENABLE_ROI_BRAIN: import.meta.env.VITE_ENABLE_ROI_BRAIN,
  VITE_ROI_BRAIN_ROLLOUT_PCT: import.meta.env.VITE_ROI_BRAIN_ROLLOUT_PCT,
  VITE_ROIBRAIN_NEEDAGENTIQ_ENABLED: import.meta.env.VITE_ROIBRAIN_NEEDAGENTIQ_ENABLED,
  VITE_ROIBRAIN_SKILLSCOPE_ENABLED: import.meta.env.VITE_ROIBRAIN_SKILLSCOPE_ENABLED,
  VITE_ROIBRAIN_FULL_INTEGRATION_ENABLED: import.meta.env.VITE_ROIBRAIN_FULL_INTEGRATION_ENABLED,
  VITE_ROIBRAIN_MONEYLOST_STRICT: import.meta.env.VITE_ROIBRAIN_MONEYLOST_STRICT,
  VITE_REPORT_TIMEOUT_MS: import.meta.env.VITE_REPORT_TIMEOUT_MS,
});

export const env = parsed;

// Feature Flag Helpers
export const featureFlags = {
  roiBrainEnabled: parsed.VITE_ENABLE_ROI_BRAIN === 'true',
  roiBrainRolloutPct: parseInt(parsed.VITE_ROI_BRAIN_ROLLOUT_PCT || '0'),
  
  // Granular ROI Brain Feature Flags
  roiBrainNeedAgentIQEnabled: parsed.VITE_ROIBRAIN_NEEDAGENTIQ_ENABLED === 'true',
  roiBrainSkillScopeEnabled: parsed.VITE_ROIBRAIN_SKILLSCOPE_ENABLED === 'true',
  roiBrainFullIntegrationEnabled: parsed.VITE_ROIBRAIN_FULL_INTEGRATION_ENABLED === 'true',
  // FASE 4.3: Money Lost Strict Mode Flag
  roiBrainMoneyLostStrict: parsed.VITE_ROIBRAIN_MONEYLOST_STRICT === 'true',
  
  // PLAN D: Report Timeout Configuration
  reportTimeoutMs: parseInt(parsed.VITE_REPORT_TIMEOUT_MS || '45000'),
  
  // Determine if user should use ROI Brain (canary rollout)
  shouldUseRoiBrain(): boolean {
    if (!this.roiBrainEnabled) return false;
    if (this.roiBrainRolloutPct >= 100) return true;
    
    // Deterministic rollout based on session
    const sessionId = sessionStorage.getItem('roi-brain-session') || 
                     Math.random().toString(36).substring(7);
    sessionStorage.setItem('roi-brain-session', sessionId);
    
    const hash = sessionId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return Math.abs(hash % 100) < this.roiBrainRolloutPct;
  },

  // Granular Feature Helpers
  shouldUseRoiBrainNeedAgentIQ(): boolean {
    // FASE 2.1 FIX: Se ROI Brain è attivo, abilita automaticamente NeedAgentIQ integration
    return this.shouldUseRoiBrain(); // Semplificato per evitare double flag dependency
  },

  shouldUseRoiBrainSkillScope(): boolean {
    return this.shouldUseRoiBrain() && this.roiBrainSkillScopeEnabled;
  },

  shouldUseRoiBrainFullIntegration(): boolean {
    return this.shouldUseRoiBrain() && this.roiBrainFullIntegrationEnabled;
  }
};