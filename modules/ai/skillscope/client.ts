import { supabase } from "@/integrations/supabase/client";
import type { SkillScopeOutput, SkillScopeInput } from "./types";

export type SkillScopeResponse = SkillScopeOutput;

export async function requestSkillScope(input: SkillScopeInput): Promise<SkillScopeResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('skillscope_generate', {
      body: input,
    });

    if (error) {
      console.error('SkillScope API error:', error);
      return {
        success: false,
        error: { message: error.message || "Failed to generate SkillScope brief" }
      };
    }

    return data as SkillScopeOutput;
  } catch (error) {
    console.error('SkillScope request failed:', error);
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : "Network error" }
    };
  }
}

// Legacy function for backward compatibility
export async function requestSkillScopeBrief(payload: Record<string, unknown>): Promise<SkillScopeOutput> {
  return requestSkillScope(payload as SkillScopeInput);
}