import { supabase } from "@/integrations/supabase/client";
import { SkillScopeOutputSchema, type SkillScopeOutput } from "@/lib/schemas/skillscope";
import type { SkillScopePayload } from "./types";

export async function requestSkillScope(
  payload: SkillScopePayload,
  signal?: AbortSignal
): Promise<SkillScopeOutput> {
  try {
    const { data, error } = await supabase.functions.invoke('ai_skillscope_generate', {
      body: payload,
    });

    if (error) {
      console.error('SkillScope API error:', error);
      
      if (error.message?.includes('401')) {
        return {
          success: false,
          error: { message: "Authentication required. Please log in and try again." }
        };
      }
      
      if (error.message?.includes('422')) {
        return {
          success: false,
          error: { message: "Invalid request data. Please try again." }
        };
      }
      
      return {
        success: false,
        error: { message: "Failed to generate SkillScope brief. Please try again later." }
      };
    }

    // Validate response with Zod
    try {
      return SkillScopeOutputSchema.parse(data);
    } catch (validationError) {
      console.error('SkillScope validation error:', validationError);
      return {
        success: false,
        error: { message: "We couldn't generate a valid brief. Please try again." }
      };
    }

  } catch (error) {
    if (signal?.aborted) {
      return {
        success: false,
        error: { message: "Request was cancelled." }
      };
    }

    console.error('SkillScope request failed:', error);
    return {
      success: false,
      error: { message: "Network error. Please check your connection and try again." }
    };
  }
}