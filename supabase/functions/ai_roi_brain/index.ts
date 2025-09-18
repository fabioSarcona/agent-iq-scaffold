import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logger } from '../_shared/logger.ts'
import { ROIBrainInputSchema } from '../_shared/validation.ts'
import { z } from 'https://esm.sh/zod@3.22.4'
import { corsHeaders } from '../_shared/env.ts'

// Import modularized functions
import { extractBusinessContext, type BusinessContextNormalized } from './businessExtractor.ts'
import { mergeMoneyLostData } from './moneyLostMerger.ts'
import { loadFilteredKB, getKBForPrompt } from './kbLoader.ts'
import { generateContextualPrompt, buildClaudePrompt } from './promptBuilder.ts'
import { distributeOutput, validateParts, AIResponseSchema, type AIResponseType } from './outputDistributor.ts'

// Initialize Supabase for L2 cache
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate cache key based on input
function generateCacheKey(input: any): string {
  const keyData = {
    vertical: input.vertical,
    auditAnswers: input.auditAnswers,
    scoreSummary: input.scoreSummary,
    moneyLostSummary: input.moneyLostSummary || input.moneylost
  };
  
  // Create a deterministic hash of the input
  const jsonStr = JSON.stringify(keyData, Object.keys(keyData).sort());
  let hash = 0;
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// Check L2 cache for existing results
async function checkCache(cacheKey: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('roi_brain_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    // Update access count
    await supabase
      .from('roi_brain_cache')
      .update({ access_count: data.access_count + 1 })
      .eq('id', data.id);

    return data.ai_response;
  } catch (error) {
    logger.warn('Cache check failed', { error: error.message, cacheKey });
    return null;
  }
}

// Store result in L2 cache
async function storeInCache(cacheKey: string, businessContext: any, aiResponse: any, processingTime: number, costs: any): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour cache

    await supabase
      .from('roi_brain_cache')
      .insert({
        cache_key: cacheKey,
        business_context: businessContext,
        kb_payload: {}, // Could store KB payload if needed
        ai_response: aiResponse,
        processing_time: processingTime,
        input_tokens: costs.inputTokens || 0,
        output_tokens: costs.outputTokens || 0,
        total_cost: costs.totalCost || 0,
        expires_at: expiresAt.toISOString()
      });

    logger.info('Result cached successfully', { cacheKey });
  } catch (error) {
    logger.warn('Failed to cache result', { error: error.message, cacheKey });
  }
}

// Schemas now imported from outputDistributor module

// Type definitions now imported from businessExtractor module

// Input Normalizer Class - Centralized Architecture Component
class InputNormalizer {
  static normalize(rawInput: any): BusinessContextNormalized {
    const vertical = rawInput.vertical || 'dental';
    const auditAnswers = rawInput.auditAnswers || {};
    
    // Normalize scoreSummary with defaults
    const scoreSummary = {
      overall: rawInput.scoreSummary?.overall || 50,
      sections: rawInput.scoreSummary?.sections || []
    };
    
    // Ensure sections have required fields
    if (scoreSummary.sections.length === 0) {
      // Create default sections based on vertical
      const defaultSections = vertical === 'dental' 
        ? [
            { sectionId: 'patient_communication', name: 'Patient Communication', score: 50 },
            { sectionId: 'appointment_management', name: 'Appointment Management', score: 50 },
            { sectionId: 'follow_up', name: 'Follow Up', score: 50 }
          ]
        : [
            { sectionId: 'customer_service', name: 'Customer Service', score: 50 },
            { sectionId: 'scheduling', name: 'Scheduling', score: 50 },
            { sectionId: 'emergency_response', name: 'Emergency Response', score: 50 }
          ];
      scoreSummary.sections = defaultSections;
    } else {
      // Ensure existing sections have name field
      scoreSummary.sections = scoreSummary.sections.map((section: any, index: number) => ({
        sectionId: section.sectionId || `section_${index}`,
        name: section.name || `Section ${index + 1}`,
        score: section.score || 50
      }));
    }
    
    // Use modularized money lost merger
    const moneyLostSummary = mergeMoneyLostData(rawInput, vertical);
    
    return {
      vertical,
      auditAnswers,
      scoreSummary,
      moneyLostSummary
    };
  }
}

// Business extraction and prompt generation now handled by imported modules

// CORS headers imported from shared env

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const startTime = Date.now();
    logger.info('ROI Brain function started - Claude Integration Phase');
    
    const rawInput = await req.json();
    
    // Generate cache key for L2 caching
    const cacheKey = generateCacheKey(rawInput);
    
    // Check L2 cache first
    const cachedResult = await checkCache(cacheKey);
    if (cachedResult) {
      logger.info('Cache hit - returning cached result', { cacheKey });
      return new Response(JSON.stringify({
        ...cachedResult,
        cacheHit: true,
        processingTime: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Step 1: Validate raw input with flexible schema
    let validInput;
    try {
      validInput = ROIBrainInputSchema.parse(rawInput);
    } catch (validationError) {
      logger.error('Input validation failed', { 
        error: validationError instanceof z.ZodError ? validationError.errors : validationError.message,
        rawInput: JSON.stringify(rawInput, null, 2).substring(0, 1000)
      });
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid input format', 
        details: validationError instanceof z.ZodError ? validationError.errors : [validationError.message],
        hint: 'Check that vertical, auditAnswers are provided. scoreSummary and money data are optional and will be defaulted.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Normalize input to consistent format (Centralized Architecture Component)
    const normalizedContext = InputNormalizer.normalize(validInput);
    logger.info('Input normalized successfully', {
      vertical: normalizedContext.vertical,
      sectionsCount: normalizedContext.scoreSummary.sections.length,
      hasMoneyData: !!normalizedContext.moneyLostSummary,
      totalMonthlyLoss: normalizedContext.moneyLostSummary?.total?.monthlyUsd
    });
    
    // Step 3: Extract business intelligence from normalized context
    const intelligence = extractBusinessContext(normalizedContext);
    logger.info('Business Intelligence extracted', intelligence);
    
    // Step 4: Generate contextual prompt
    const contextualPrompt = generateContextualPrompt(normalizedContext, intelligence);
    
    // Step 5: Extract relevant KB data based on business context
    const kbPayload = getKBForPrompt(normalizedContext, intelligence.primaryPainPoints);
    
    // Enhanced logging for debugging data quality
    logger.info('Business context extracted', {
      vertical: normalizedContext.vertical,
      businessSize: intelligence.businessSize,
      urgencyLevel: intelligence.urgencyLevel,
      technicalReadiness: intelligence.technicalReadiness,
      auditResponsesCount: Object.keys(normalizedContext.auditAnswers).length,
      aiReadinessScore: normalizedContext.scoreSummary.overall,
      moneyLostItems: normalizedContext.moneyLostSummary?.areas?.length || 0,
      totalMonthlyLoss: normalizedContext.moneyLostSummary?.total?.monthlyUsd,
      primaryPainPoints: intelligence.primaryPainPoints
    });
    
    // Log KB payload structure for debugging
    if (kbPayload) {
      logger.info('KB payload structure', {
        voiceSkillsCount: kbPayload.voiceSkills?.length || 0,
        painPointsCount: kbPayload.painPoints?.length || 0,
        pricingTiersCount: kbPayload.pricing?.length || 0,
        faqItemsCount: kbPayload.faq?.length || 0,
        hasResponseModels: !!kbPayload.responseModels,
        brandDataPresent: !!kbPayload.brand
      });
    }

    // Make Claude API call with enhanced prompt
    const claudeStart = Date.now();
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000, // Increased from 4000 to prevent truncation
        messages: [{
          role: 'user',
          content: buildClaudePrompt(
            contextualPrompt,
            kbPayload,
            validInput.language || 'en',
            normalizedContext.vertical
          )
        }]
      })
    });

    const claudeTime = Date.now() - claudeStart;

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.statusText}`);
    }

    const claudeData = await claudeResponse.json();
    const aiContent = claudeData.content[0]?.text;

    if (!aiContent) {
      throw new Error('No content returned from Claude API');
    }

    // Enhanced logging for Claude's raw response
    logger.info('Claude raw response received', {
      responseLength: aiContent.length,
      tokensUsed: {
        input: claudeData.usage?.input_tokens,
        output: claudeData.usage?.output_tokens
      },
      isTruncated: aiContent.length >= 7500,
      contentPreview: aiContent.substring(0, 200) // First 200 chars for debugging
    });

    // Log response length and check for truncation
    logger.info('Claude response received', { 
      contentLength: aiContent.length,
      isTruncated: aiContent.length >= 7500, // Close to max_tokens limit
      tokenUsage: claudeData.usage
    });

    // Helper function to extract JSON from markdown-wrapped text
    function extractJsonFromText(text: string): any {
      // First, try to find JSON within markdown code blocks
      const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
      const match = text.match(jsonBlockRegex);
      
      if (match) {
        try {
          return JSON.parse(match[1]);
        } catch (error) {
          logger.warn('Found markdown block but failed to parse JSON', { error: error.message });
        }
      }
      
      // Try direct parsing
      try {
        return JSON.parse(text);
      } catch (error) {
        // Last resort: try to extract balanced braces
        const braceStart = text.indexOf('{');
        const braceEnd = text.lastIndexOf('}');
        
        if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
          const extracted = text.substring(braceStart, braceEnd + 1);
          try {
            return JSON.parse(extracted);
          } catch (extractError) {
            logger.error('All JSON extraction methods failed', { 
              originalError: error.message,
              extractError: extractError.message,
              contentPreview: text.substring(0, 200) 
            });
          }
        }
        
        throw new Error(`Unable to extract valid JSON. Content: ${text.substring(0, 200)}...`);
      }
    }

    // Parse Claude's JSON response with robust extraction
    let parsedContent;
    try {
      parsedContent = extractJsonFromText(aiContent);
      logger.info('Successfully extracted JSON from AI response');
    } catch (error) {
      logger.error('Failed to parse Claude response as JSON', { 
        error: error.message, 
        contentPreview: aiContent.substring(0, 300),
        contentLength: aiContent.length
      });
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the parsed response with AIResponseSchema first
    let validatedAIResponse;
    try {
      validatedAIResponse = AIResponseSchema.parse(parsedContent);
      
      // Data quality validation
      const diagnosisLength = validatedAIResponse.diagnosis?.join(' ').length || 0;
      const consequencesCount = validatedAIResponse.consequences?.length || 0;
      const solutionsCount = validatedAIResponse.solutions?.length || 0;
      
      // Log data quality metrics
      logger.info('Data quality metrics', {
        diagnosisLength,
        consequencesCount,
        solutionsCount,
        hasVerticalSpecificContent: diagnosisLength > 100 && consequencesCount > 2,
        dataQuality: diagnosisLength > 200 && consequencesCount > 3 ? 'high' : 
                     diagnosisLength > 100 && consequencesCount > 2 ? 'medium' : 'low',
        vertical: normalizedContext.vertical,
        businessSize: intelligence.businessSize
      });
      
      // Validation for vertical-specific content
      const isVerticalSpecific = validatedAIResponse.diagnosis.some(d => 
        d.toLowerCase().includes(normalizedContext.vertical.toLowerCase()) ||
        (normalizedContext.vertical === 'dental' && (d.toLowerCase().includes('patient') || d.toLowerCase().includes('appointment'))) ||
        (normalizedContext.vertical === 'hvac' && (d.toLowerCase().includes('customer') || d.toLowerCase().includes('service')))
      );
      
      if (!isVerticalSpecific) {
        logger.warn('Low vertical personalization detected', {
          vertical: normalizedContext.vertical,
          diagnosisPreview: validatedAIResponse.diagnosis[0]?.substring(0, 100) + '...',
          businessName: normalizedContext.auditAnswers?.business_name
        });
      }
      
      logger.info('AI response validated successfully');
    } catch (aiValidationError) {
      logger.error('AI output validation failed', { 
        error: aiValidationError instanceof z.ZodError ? aiValidationError.errors : aiValidationError.message,
        aiContent: aiContent.substring(0, 1000) // Show more content for debugging
      });
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'AI generated invalid response format', 
        details: aiValidationError instanceof z.ZodError ? aiValidationError.errors : [aiValidationError.message],
        phase: 'AI Output Validation'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validation and mapping now handled by outputDistributor module

    // Enhanced response with business context and Claude integration
    const totalTime = Date.now() - startTime;
    
    // Use modularized output distribution
    const response = distributeOutput(
      validatedAIResponse,
      intelligence,
      {
        totalTime,
        aiTime: claudeTime,
        claudeData
      },
      contextualPrompt,
      normalizedContext
    );

    // Store in L2 cache for future requests
    await storeInCache(cacheKey, normalizedContext, response, totalTime, response.costs);

    logger.info('ROI Brain computation completed', {
      vertical: normalizedContext.vertical,
      businessSize: intelligence.businessSize,
      urgencyLevel: intelligence.urgencyLevel,
      processingTime: totalTime,
      aiTime: claudeTime,
      cacheKey,
      dataQuality,
      qualityMetrics: {
        diagnosisLength,
        consequencesCount,
        verticalPersonalization: validatedAIResponse.diagnosis.some(d => 
          d.toLowerCase().includes(normalizedContext.vertical.toLowerCase())
        )
      },
      normalizedInput: {
        sectionsCount: normalizedContext.scoreSummary.sections.length,
        monthlyLoss: normalizedContext.moneyLostSummary?.total?.monthlyUsd
      }
    });

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('ROI Brain processing failed', { 
      error: error.message,
      stack: error.stack,
      phase: 'Runtime Error'
    });
    
    // This should not happen as we handle Zod errors above
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unexpected validation error', 
        details: error.errors,
        phase: 'Unexpected Validation'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Runtime errors (500)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal processing error',
        message: error.message || 'Unknown error occurred',
        phase: 'Runtime Processing'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});