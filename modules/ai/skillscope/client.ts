import { supabase } from "@/integrations/supabase/client";
import type { SkillScopeOutput } from "./types";

export async function requestSkillScopeBrief(payload: Record<string, unknown>): Promise<SkillScopeOutput> {
  try {
    const { data, error } = await supabase.functions.invoke('ai_skillscope_generate', {
      body: payload,
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