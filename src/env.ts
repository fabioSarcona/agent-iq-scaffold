import { z } from 'zod';

const schema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(10),
  // Feature Flags for Single Brain Rollout
  VITE_ENABLE_ROI_BRAIN: z.string().optional().default('false'),
  VITE_ROI_BRAIN_ROLLOUT_PCT: z.string().optional().default('0'),
});

const parsed = schema.parse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_ENABLE_ROI_BRAIN: import.meta.env.VITE_ENABLE_ROI_BRAIN,
  VITE_ROI_BRAIN_ROLLOUT_PCT: import.meta.env.VITE_ROI_BRAIN_ROLLOUT_PCT,
});

export const env = parsed;

// Feature Flag Helpers
export const featureFlags = {
  roiBrainEnabled: parsed.VITE_ENABLE_ROI_BRAIN === 'true',
  roiBrainRolloutPct: parseInt(parsed.VITE_ROI_BRAIN_ROLLOUT_PCT || '0'),
  
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
  }
};