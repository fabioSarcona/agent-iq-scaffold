import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logger } from '../_shared/logger.ts'
import { ROIBrainInputSchema } from '../_shared/validation.ts'
import { z } from 'https://esm.sh/zod@3.22.4'
import { corsHeaders } from '../_shared/env.ts'

// Import modularized functions
import { extractBusinessContext, type BusinessContextNormalized } from './businessExtractor.ts'
import { mergeMoneyLostData } from './moneyLostMerger.ts'
import { 
  loadKBWithSignalTags, 
  generateKBFilterSignature, 
  initializeKBValidation,
  KB_VERSION 
} from './kbLoader.ts'
import { generateContextualPrompt, buildClaudePrompt, PROMPT_VERSION } from './promptBuilder.ts'
import { distributeOutput, validateParts, AIResponseSchema, type AIResponseType } from './outputDistributor.ts'
import { generateCacheKey, getOrCompute, getCacheMetrics, performCacheCleanup, L1 } from './cache.ts'
import { SIGNAL_RULES_VERSION } from './signalRules.ts'
import { getVoiceSkillMapperVersion, validateVoiceSkillMapper } from './voiceSkillMapper.ts'

// Initialize Supabase for L2 cache
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// AI Model Configuration
const MODEL_NAME = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 8000;
const TEMPERATURE = undefined; // Sonnet 4 doesn't support temperature

// L2 Cache Functions
async function readL2Cache(cacheKey: string): Promise<any | null> {
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
    logger.warn('L2 cache read failed', { error: error.message, cacheKey: cacheKey.substring(0, 8) });
    return null;
  }
}

async function storeL2Cache(cacheKey: string, value: any): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour cache

    await supabase
      .from('roi_brain_cache')
      .insert({
        cache_key: cacheKey,
        business_context: value.businessContext || {},
        kb_payload: {}, 
        ai_response: value,
        processing_time: value.processingTime || 0,
        input_tokens: value.costs?.inputTokens || 0,
        output_tokens: value.costs?.outputTokens || 0,
        total_cost: value.costs?.totalCost || 0,
        expires_at: expiresAt.toISOString()
      });

    logger.info('L2 cache stored', { cacheKey: cacheKey.substring(0, 8) });
  } catch (error) {
    logger.warn('L2 cache store failed', { error: error.message, cacheKey: cacheKey.substring(0, 8) });
  }
}

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
    logger.info('ROI Brain function started - Enhanced Cache Phase');
    
    const rawInput = await req.json();
    
    // Lazy cleanup of L1 cache
    const cleanupStats = performCacheCleanup();
    if (cleanupStats.l1Cleaned > 0) {
      logger.info('L1 cache cleanup', cleanupStats);
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

    // Step 2: Normalize input to consistent format
    const normalizedContext = InputNormalizer.normalize(validInput);
    logger.info('Input normalized successfully', {
      vertical: normalizedContext.vertical,
      sectionsCount: normalizedContext.scoreSummary.sections.length,
      hasMoneyData: !!normalizedContext.moneyLostSummary,
      totalMonthlyLoss: normalizedContext.moneyLostSummary?.total?.monthlyUsd
    });
    
    // Step 3: Initialize KB validation (run once per cold start)
    const kbValidation = initializeKBValidation();
    if (kbValidation.warnings.length > 0) {
      logger.warn('KB validation issues detected', kbValidation.warnings);
    }
    
    // Voice Skill Mapper validation
    const skillMapperValidation = validateVoiceSkillMapper();
    if (!skillMapperValidation.isValid) {
      logger.warn('Voice Skill Mapper validation failed', skillMapperValidation.warnings);
    }
    
    // Step 4: Extract business intelligence from normalized context
    const intelligence = extractBusinessContext(normalizedContext);
    logger.info('Business Intelligence extracted', intelligence);
    
    // Step 5: Load KB with signal-based filtering (Phase 3.2)
    const kbResult = loadKBWithSignalTags(
      normalizedContext,
      normalizedContext.auditAnswers,
      normalizedContext.vertical
    );
    
    // Step 6: Generate enhanced cache key with signal tags
    const cacheKey = await generateCacheKey({
      vertical: normalizedContext.vertical,
      auditAnswers: normalizedContext.auditAnswers,  
      moneyLost: normalizedContext.moneyLostSummary,
      kbVersion: KB_VERSION,
      promptVersion: PROMPT_VERSION,
      signalRulesVersion: SIGNAL_RULES_VERSION,
      voiceSkillMapperVersion: getVoiceSkillMapperVersion(),
      model: MODEL_NAME,
      max_tokens: MAX_TOKENS,
      ...(TEMPERATURE !== undefined && { temperature: TEMPERATURE }),
      locale: validInput.language || 'en',
      kbFilterSignature: kbResult.kbFilterSignature,
      signalTags: kbResult.signalTags,
      kbSections: kbResult.kbSectionsSelected
    });
    
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
      primaryPainPoints: intelligence.primaryPainPoints,
      cacheKeyPrefix: cacheKey.substring(0, 8),
      kbFilterSignature: kbResult.kbFilterSignature.substring(0, 12),
      signalTags: kbResult.signalTags,
      kbSectionsSelected: kbResult.kbSectionsSelected.length,
      signalRulesMatched: kbResult.metrics?.rulesMatched || 0
    });
    
    // Log KB payload structure for debugging
    if (kbResult.filteredKB) {
      logger.info('KB payload structure', {
        voiceSkillsCount: kbResult.filteredKB.voiceSkills?.length || 0,
        painPointsCount: kbResult.filteredKB.painPoints?.length || 0,
        pricingTiersCount: kbResult.filteredKB.pricing?.length || 0,
        faqItemsCount: kbResult.filteredKB.faq?.length || 0,
        hasResponseModels: !!kbResult.filteredKB.responseModels,
        brandDataPresent: !!kbResult.filteredKB.brand,
        signalBasedFiltering: true,
        signalRulesVersion: SIGNAL_RULES_VERSION
      });
    }

    // Step 6: Use L1+L2 cache system with computation
    const computeResult = await getOrCompute(
      cacheKey,
      async () => {
        // AI Processing Pipeline
        logger.info('Cache miss - computing new result');
        
        // Generate contextual prompt
        const contextualPrompt = generateContextualPrompt(normalizedContext, intelligence);
        
        // Debug logging - RIMUOVI DOPO IL TEST
        const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
        console.log('API CHECK:', {
          hasKey: !!apiKey,
          keyPrefix: apiKey?.substring(0, 7),
          keyLength: apiKey?.length,
          expectedFormat: 'Should start with "sk-ant-"'
        });

        // Make Claude API call
        const claudeStart = Date.now();
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: MODEL_NAME,
            max_tokens: MAX_TOKENS,
            ...(TEMPERATURE !== undefined && { temperature: TEMPERATURE }),
            messages: [{
              role: 'user',
            content: buildClaudePrompt(
              contextualPrompt,
              kbResult.filteredKB,
              validInput.language || 'en',
              normalizedContext.vertical
            )
            }]
          })
        });

        const claudeTime = Date.now() - claudeStart;

        if (!claudeResponse.ok) {
          const errorBody = await claudeResponse.text();
          console.error('ANTHROPIC API ERROR DETAILS:', {
            status: claudeResponse.status,
            statusText: claudeResponse.statusText,
            body: errorBody,
            apiKeyPresent: !!Deno.env.get('ANTHROPIC_API_KEY'),
            apiKeyLength: Deno.env.get('ANTHROPIC_API_KEY')?.length
          });
          throw new Error(`Claude API error ${claudeResponse.status}: ${errorBody}`);
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
          isTruncated: aiContent.length >= 7500
        });

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
            aiContent: aiContent.substring(0, 1000)
          });
          throw new Error('AI generated invalid response format');
        }

        // Generate final response
        const totalTime = Date.now() - startTime;
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
        
        // Add signal-based telemetry to response
        if (response.consistency) {
          response.consistency = {
            ...response.consistency,
            signalTags: kbResult.signalTags,
            kbSectionsSelected: kbResult.kbSectionsSelected,
            kbFilterSignature: kbResult.kbFilterSignature,
            signalRulesVersion: SIGNAL_RULES_VERSION,
            signalMetrics: kbResult.metrics
          };
        }
        
        return response;
      },
      (key, value) => storeL2Cache(key, value),
      (key) => readL2Cache(key)
    );

    // Logging with cache metrics
    const cacheMetrics = getCacheMetrics();
    const processingTime = Date.now() - startTime;
    
    logger.info('ROI Brain computation completed', {
      vertical: normalizedContext.vertical,
      businessSize: intelligence.businessSize,
      urgencyLevel: intelligence.urgencyLevel,
      processingTime,
      cacheKeyPrefix: cacheKey.substring(0, 8),
      kbVersion: KB_VERSION,
      promptVersion: PROMPT_VERSION,
      signalRulesVersion: SIGNAL_RULES_VERSION,
      voiceSkillMapperVersion: getVoiceSkillMapperVersion(),
      model: MODEL_NAME,
      kbFilterSignature: kbResult.kbFilterSignature.substring(0, 12),
      signalTags: kbResult.signalTags,
      kbSectionsCount: kbResult.kbSectionsSelected.length,
      l1Hit: false, // This was a computation path
      l2Hit: false,
      cacheMetrics,
      normalizedInput: {
        sectionsCount: normalizedContext.scoreSummary.sections.length,
        monthlyLoss: normalizedContext.moneyLostSummary?.total?.monthlyUsd
      }
    });

    return new Response(
      JSON.stringify(computeResult),
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