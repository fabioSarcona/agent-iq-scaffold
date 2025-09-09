// Environment variable handling for Edge Functions

export interface EnvConfig {
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  AI_MODEL?: string;
  AI_COST_CAP_USD?: number;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

/**
 * Get and validate environment variables
 */
export function getEnv(): EnvConfig {
  const config: EnvConfig = {
    ANTHROPIC_API_KEY: Deno.env.get('ANTHROPIC_API_KEY'),
    OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY'),
    AI_MODEL: Deno.env.get('AI_MODEL') || 'claude-3-5-sonnet-20241022',
    AI_COST_CAP_USD: parseFloat(Deno.env.get('AI_COST_CAP_USD') || '0.15'),
    SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
    SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY')
  };

  return config;
}

/**
 * Validate required environment variables for AI functions
 */
export function validateAIEnv(): { ANTHROPIC_API_KEY: string; AI_MODEL: string } {
  const config = getEnv();
  
  if (!config.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  return {
    ANTHROPIC_API_KEY: config.ANTHROPIC_API_KEY,
    AI_MODEL: config.AI_MODEL || 'claude-3-5-sonnet-20241022'
  };
}

/**
 * Common CORS headers
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-client',
} as const;