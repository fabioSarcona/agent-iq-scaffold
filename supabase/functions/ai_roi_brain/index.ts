import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BusinessContext {
  vertical: 'dental' | 'hvac';
  auditAnswers: Record<string, unknown>;
  scoreSummary?: {
    overall: number;
    sections: Array<{ name: string; score: number }>;
  };
  moneylost?: Array<{
    area: string;
    monthlyLoss: number;
    confidence: 'low' | 'medium' | 'high';
  }>;
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
    console.log('ROI Brain function started - minimal version');
    
    const input = await req.json();
    console.log('Input received:', JSON.stringify(input, null, 2));

    // Minimal response for testing
    const response = {
      success: true,
      sessionId: `session_${Date.now()}`,
      voiceFitReport: {
        overall: {
          score: 75,
          recommendation: "This is a minimal test response from ROI Brain function"
        },
        sections: [],
        recommendations: [],
        caseStudies: []
      },
      needAgentIQInsights: [],
      processingTime: {
        total: 100,
        ai: 50,
        cache: 0
      },
      costs: {
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0
      }
    };

    console.log('Returning minimal response');
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('ROI Brain error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: { message: error.message || 'Internal server error' }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});