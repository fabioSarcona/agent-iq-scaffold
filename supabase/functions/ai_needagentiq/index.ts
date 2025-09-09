import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Shared modules
import { corsHeaders } from '../_shared/env.ts';
import { logger } from '../_shared/logger.ts';
import { NeedAgentIQSimpleInputSchema, NeedAgentIQSimpleOutputSchema } from '../_shared/validation.ts';

// Get auth helper
function getAuth(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // In a real implementation, you'd verify the JWT token
  // For now, just check if bearer token exists
  const token = authHeader.slice(7);
  return token ? { user: { id: 'user' } } : null;
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function jsonOk(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function logError(event: string, data: Record<string, any>) {
  logger.error(event, data);
}

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Check JWT authentication
  const auth = getAuth(req);
  if (!auth?.user) {
    return jsonError('Unauthorized', 401);
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  try {
    // Parse and validate input
    const body = await req.json();
    const { vertical, sectionId, answersSection } = NeedAgentIQSimpleInputSchema.parse(body);

    logger.info('Processing NeedAgentIQ request', { 
      sectionId, 
      vertical,
      answersCount: Object.keys(answersSection).length
    });

    // Load system prompt from environment
    const systemPrompt = Deno.env.get('NEEDAGENT_IQ_SYSTEM_PROMPT') ?? '';
    if (!systemPrompt) {
      logError('needagentiq_missing_prompt', {});
      return jsonError('Missing system prompt', 500);
    }

    // Load Anthropic API key
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      logError('needagentiq_missing_api_key', {});
      return jsonError('Missing API key', 500);
    }

    // Prepare user message
    const userMessage = {
      vertical,
      sectionId,
      answersSection: Object.fromEntries(
        Object.entries(answersSection).map(([k, v]) => [
          k, 
          typeof v === 'string' ? v.slice(0, 200) : v // PII protection
        ])
      )
    };

    // Call Anthropic API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_completion_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: JSON.stringify(userMessage)
          }
        ],
        system: systemPrompt
      })
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      logError('anthropic_api_error', { 
        status: anthropicResponse.status,
        msg: errorText.slice(0, 160)
      });
      return jsonError('AI processing failed', 500);
    }

    const anthropicData = await anthropicResponse.json();
    const content = anthropicData.content?.[0]?.text;

    let insights = [];
    if (content) {
      try {
        const parsed = JSON.parse(content);
        
        // Validate & sanitize output
        insights = NeedAgentIQSimpleOutputSchema.parse(parsed).map(i => ({
          ...i,
          rationale: i.rationale.map(s => s.slice(0, 240)) // hard cap to avoid PII spill
        }));
      } catch (parseError) {
        logError('parse_llm_response_error', { 
          msg: parseError.message?.slice(0, 160) 
        });
        insights = []; // Fallback to empty array
      }
    }

    const processingTime = Date.now() - startTime;

    logger.info('NeedAgentIQ completed', { 
      sectionId, 
      vertical,
      insights: insights.length,
      processingTime 
    });

    return jsonOk(insights);

  } catch (error) {
    logError('needagentiq_error', { 
      msg: error?.message?.slice(0, 160),
      code: error?.code,
      name: error?.name
    });

    if (error.name === 'ZodError') {
      return jsonError('Invalid input format', 400);
    }

    return jsonError('Internal server error', 500);
  }
});