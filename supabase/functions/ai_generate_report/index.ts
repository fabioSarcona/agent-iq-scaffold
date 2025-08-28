import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  LLMInputSchema, 
  LLMOutputSchema, 
  type LLMInput, 
  type LLMOutput 
} from './schemas.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cache for system prompt and KB data
let systemPromptCache: string | null = null
let kbCache: { approved_claims: string[], services: any[] } | null = null

async function loadSystemPrompt(): Promise<string> {
  if (systemPromptCache) return systemPromptCache
  
  try {
    systemPromptCache = await Deno.readTextFile(
      new URL('./system-prompt-voicefit.md', import.meta.url)
    )
    return systemPromptCache
  } catch (error) {
    console.error('Failed to load system prompt:', error)
    throw new Error('System prompt not available')
  }
}

async function loadKB(): Promise<{ approved_claims: string[], services: any[] }> {
  if (kbCache) return kbCache
  
  try {
    const [claimsText, servicesText] = await Promise.all([
      Deno.readTextFile(new URL('./kb/approved_claims.json', import.meta.url)),
      Deno.readTextFile(new URL('./kb/services.json', import.meta.url))
    ])
    
    kbCache = {
      approved_claims: JSON.parse(claimsText),
      services: JSON.parse(servicesText)
    }
    return kbCache
  } catch (error) {
    console.error('Failed to load KB files:', error)
    return { approved_claims: [], services: [] }
  }
}

function buildLLMInput({ 
  vertical, 
  answers, 
  scoreSummary, 
  moneylost, 
  benchmarks 
}: {
  vertical: string
  answers: Record<string, unknown>
  scoreSummary?: any
  moneylost?: any
  benchmarks?: string[]
}): LLMInput {
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Convert answers to audit responses format
  const responses = Object.entries(answers).map(([key, value], index) => ({
    id: `q_${index}`,
    key,
    value,
    section: key.includes('daily_unanswered') ? 'calls' : 
             key.includes('no_shows') ? 'appointments' : 
             key.includes('treatment_plan') ? 'treatment' : 'general'
  }))

  // Convert moneylost to required format
  const moneyLostItems = moneylost?.areas?.map((area: any) => ({
    area: area.title || area.id,
    assumptions: area.notes ? [area.notes] : [],
    formula: `${area.dailyUsd} * workdays_per_month`,
    resultMonthly: area.monthlyUsd || 0,
    confidence: area.confidence === 'high' ? 90 : area.confidence === 'medium' ? 70 : 50
  })) || []

  // Generate insights from top loss areas
  const insights = moneylost?.areas?.slice(0, 3).map((area: any, index: number) => ({
    key: `insight_${index}`,
    area: area.title || area.id,
    problem: `Revenue leakage identified in ${area.title?.toLowerCase() || area.id}`,
    impactMonthly: area.monthlyUsd || 0,
    recommendations: [`Implement AI automation for ${area.title?.toLowerCase() || area.id}`],
    confidence: area.confidence === 'high' ? 90 : area.confidence === 'medium' ? 70 : 50
  })) || []

  return {
    context: {
      auditId,
      auditType: vertical as "dental" | "hvac",
      business: {
        name: String(answers.business_name || "Business"),
        location: String(answers.location || "Unknown"),
        size: {
          chairs: typeof answers.chairs === 'number' ? answers.chairs : undefined,
          techs: typeof answers.techs === 'number' ? answers.techs : undefined
        }
      },
      settings: {
        currency: "USD",
        locale: "en-US",
        preferredPlan: undefined,
        maxSkills: 6
      }
    },
    audit: {
      responses,
      sectionScores: scoreSummary?.sectionScores,
      aiReadinessScore: scoreSummary?.overallScore
    },
    moneyLost: {
      items: moneyLostItems,
      totalMonthly: moneylost?.monthlyUsd || 0
    },
    insights,
    kb: kbCache || { approved_claims: [], services: [] },
    history: {
      previousInsightsKeys: [],
      previousReports: []
    }
  }
}

async function callClaude(systemPrompt: string, llmInput: LLMInput): Promise<LLMOutput> {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const startTime = Date.now()
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1800,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Generate a VoiceFit Report based on this data. Respond ONLY with valid JSON matching the LLMOutputSchema:\n\n${JSON.stringify(llmInput, null, 2)}`
      }]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${error}`)
  }

  const result = await response.json()
  const content = result.content?.[0]?.text

  if (!content) {
    throw new Error('No content received from Claude')
  }

  try {
    const parsed = JSON.parse(content)
    return LLMOutputSchema.parse(parsed)
  } catch (parseError) {
    console.error('LLM Output validation failed:', parseError)
    console.error('Raw content:', content)
    throw new Error(`LLM validation failed: ${parseError.message}`)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  
  try {
    const request = await req.json()
    console.log('Processing VoiceFit report request for:', request.vertical)

    // Load system prompt and KB
    const [systemPrompt] = await Promise.all([
      loadSystemPrompt(),
      loadKB() // This loads into cache
    ])

    // Build LLM input from our format
    const llmInput = buildLLMInput(request)
    
    // Validate input
    const validatedInput = LLMInputSchema.parse(llmInput)
    
    // Call Claude
    const llmOutput = await callClaude(systemPrompt, validatedInput)
    
    const processingTime = Date.now() - startTime
    console.log(`Report generated in ${processingTime}ms`)

    return new Response(JSON.stringify(llmOutput), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Processing-Time': `${processingTime}ms`,
        'X-Cache': 'MISS'
      }
    })
  } catch (error) {
    console.error('Error generating VoiceFit report:', error)
    
    const processingTime = Date.now() - startTime
    const errorResponse = {
      success: false,
      error: {
        message: error.message || 'Unknown error occurred',
        missing: []
      },
      metadata: {
        processing_time_ms: processingTime,
        data_quality: "low" as const,
        warnings: [`Processing failed: ${error.message}`]
      }
    }

    return new Response(JSON.stringify(errorResponse), {
      status: error.message.includes('validation') ? 422 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})