import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

// Shared modules
import { corsHeaders } from '../_shared/env.ts';
import { logger } from '../_shared/logger.ts';
import { NeedAgentIQSimpleInputSchema, NeedAgentIQSimpleOutputSchema } from '../_shared/validation.ts';

// Helper functions for response formatting

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
  console.log('🚀 NeedAgentIQ function called:', req.method, req.url);
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // No authentication required for public access

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  try {
    console.log('📥 Parsing request body...');
    // Parse and validate input
    const body = await req.json();
    console.log('📋 Body received:', JSON.stringify(body).slice(0, 200));
    const { vertical, sectionId, answersSection } = NeedAgentIQSimpleInputSchema.parse(body);
    console.log('✅ Input validated successfully');

    logger.info('Processing NeedAgentIQ request', { 
      sectionId, 
      vertical,
      answersCount: Object.keys(answersSection).length
    });

    // 🐛 DEBUG: System prompt validation
    const systemPrompt = Deno.env.get('NEEDAGENT_IQ_SYSTEM_PROMPT') ?? '';
    console.log('🐛 DEBUG: System prompt check:', {
      exists: !!systemPrompt,
      length: systemPrompt.length,
      preview: systemPrompt.slice(0, 200) + (systemPrompt.length > 200 ? '...' : '')
    });
    
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

    // 🐛 DEBUG: User message preparation
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
    
    console.log('🐛 DEBUG: User message:', {
      vertical: userMessage.vertical,
      sectionId: userMessage.sectionId,
      answersCount: Object.keys(userMessage.answersSection).length,
      answerKeys: Object.keys(userMessage.answersSection),
      fullMessage: JSON.stringify(userMessage).slice(0, 500) + '...'
    });

    // 🐛 DEBUG: Anthropic request body
    const anthropicRequest = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: JSON.stringify(userMessage)
        }
      ],
      system: systemPrompt
    };
    
    console.log('🐛 DEBUG: Anthropic request:', {
      model: anthropicRequest.model,
      max_tokens: anthropicRequest.max_tokens,
      messageLength: anthropicRequest.messages[0].content.length,
      systemPromptLength: anthropicRequest.system.length
    });

    // Call Anthropic API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(anthropicRequest)
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.log('🐛 DEBUG: Anthropic API error:', {
        status: anthropicResponse.status,
        statusText: anthropicResponse.statusText,
        errorText: errorText.slice(0, 500)
      });
      
      logError('anthropic_api_error', { 
        status: anthropicResponse.status,
        msg: errorText.slice(0, 160)
      });
      return jsonError('AI processing failed', 500);
    }

    const anthropicData = await anthropicResponse.json();
    console.log('🐛 DEBUG: Anthropic response structure:', {
      hasContent: !!anthropicData.content,
      contentLength: anthropicData.content?.length || 0,
      contentType: Array.isArray(anthropicData.content) ? 'array' : typeof anthropicData.content,
      usage: anthropicData.usage,
      model: anthropicData.model
    });
    
    const content = anthropicData.content?.[0]?.text;
    console.log('🐛 DEBUG: Raw Claude content:', {
      hasText: !!content,
      textLength: content?.length || 0,
      firstChars: content?.slice(0, 100),
      lastChars: content?.slice(-50),
      startsWithBackticks: content?.startsWith('```'),
      endsWithBackticks: content?.endsWith('```'),
      fullText: content // Log full content for debugging
    });

    let insights = [];
    if (content) {
      try {
        // 🐛 DEBUG: Content cleaning process
        console.log('🐛 DEBUG: Starting content cleaning:', {
          originalLength: content.length,
          startsWithJson: content.toLowerCase().startsWith('```json'),
          startsWithBackticks: content.startsWith('```'),
          hasBackticks: content.includes('```')
        });
        
        // Remove markdown backticks if present - Enhanced cleaning
        let cleanContent = content.trim();
        console.log('🐛 DEBUG: After trim:', {
          length: cleanContent.length,
          firstChars: cleanContent.slice(0, 50),
          lastChars: cleanContent.slice(-20)
        });
        
        // More robust backtick removal
        if (cleanContent.toLowerCase().startsWith('```json')) {
          console.log('🐛 DEBUG: Removing ```json wrapper');
          cleanContent = cleanContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
        } else if (cleanContent.startsWith('```')) {
          console.log('🐛 DEBUG: Removing ``` wrapper');
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Fallback: remove any remaining backticks at start/end
        cleanContent = cleanContent.replace(/^`+/, '').replace(/`+$/, '');
        
        console.log('🐛 DEBUG: After cleaning:', {
          length: cleanContent.length,
          firstChars: cleanContent.slice(0, 100),
          lastChars: cleanContent.slice(-50),
          fullCleanContent: cleanContent
        });
        
        // 🐛 DEBUG: JSON parsing attempt
        console.log('🐛 DEBUG: Attempting JSON.parse...');
        const parsed = JSON.parse(cleanContent);
        console.log('🐛 DEBUG: JSON.parse successful:', {
          isArray: Array.isArray(parsed),
          length: Array.isArray(parsed) ? parsed.length : 0,
          type: typeof parsed,
          keys: typeof parsed === 'object' ? Object.keys(parsed) : [],
          parsed: parsed
        });
        
        // 🐛 DEBUG: Zod validation attempt
        console.log('🐛 DEBUG: Attempting Zod validation...');
        const validationResult = NeedAgentIQSimpleOutputSchema.safeParse(parsed);
        console.log('🐛 DEBUG: Zod validation result:', {
          success: validationResult.success,
          error: !validationResult.success ? validationResult.error.issues : null,
          data: validationResult.success ? validationResult.data : null
        });
        
        if (!validationResult.success) {
          throw new Error(`Zod validation failed: ${JSON.stringify(validationResult.error.issues)}`);
        }
        
        // Validate & sanitize output
        insights = validationResult.data.map(i => ({
          ...i,
          rationale: i.rationale.map(s => s.slice(0, 240)) // hard cap to avoid PII spill
        }));
        
        console.log('🐛 DEBUG: Final insights:', {
          count: insights.length,
          insights: insights
        });
        
      } catch (parseError) {
        console.log('🐛 DEBUG: Parse error details:', {
          errorName: parseError.name,
          errorMessage: parseError.message,
          stack: parseError.stack?.slice(0, 300),
          contentBeingParsed: content?.slice(0, 500) + (content?.length > 500 ? '...' : '')
        });
        
        logError('parse_llm_response_error', { 
          msg: parseError.message?.slice(0, 160),
          contentPreview: content?.slice(0, 100)
        });
        insights = []; // Fallback to empty array
      }
    } else {
      console.log('🐛 DEBUG: No content received from Claude');
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
    console.error('❌ Error in NeedAgentIQ:', error);
    logError('needagentiq_error', { 
      msg: error?.message?.slice(0, 160),
      code: error?.code,
      name: error?.name
    });

    if (error.name === 'ZodError') {
      console.log('🔍 Zod validation error:', error.issues);
      return jsonError('Invalid input format', 400);
    }

    return jsonError('Internal server error', 500);
  }
});