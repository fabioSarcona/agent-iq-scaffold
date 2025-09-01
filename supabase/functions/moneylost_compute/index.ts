import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Shared modules
import { corsHeaders } from '../_shared/env.ts';
import { logger } from '../_shared/logger.ts';
import { MoneyLostInputSchema, MoneyLostOutputSchema } from '../_shared/validation.ts';
import type { MoneyLostInput, MoneyLostOutput, ErrorResponse } from '../_shared/types.ts';

type Vertical = 'dental' | 'hvac';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface RecoverableRange { 
  min: number; 
  max: number; 
}

interface LossArea {
  key: string; 
  title: string;
  dailyUsd: number; 
  monthlyUsd: number; 
  annualUsd: number;
  severity: Severity; 
  recoverablePctRange: RecoverableRange; 
  rationale: string[];
}

serve(async (req) => {
  const startTime = Date.now();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // JWT Authentication Check
  const auth = req.headers.get('Authorization');
  if (!auth) {
    return new Response('Unauthorized', { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const sb = createClient(supabaseUrl, supabaseAnonKey, { 
    global: { headers: { Authorization: auth } } 
  });

  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) {
    return new Response('Unauthorized', { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }

  if (req.method !== 'POST') {
    const errorResponse: ErrorResponse = {
      success: false,
      error: { message: 'Method Not Allowed', code: 'METHOD_NOT_ALLOWED' },
      metadata: { processing_time_ms: Date.now() - startTime }
    };

    return new Response(JSON.stringify(errorResponse), { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const input = MoneyLostInputSchema.parse(body);
    const { vertical, answers } = input;

    logger.info('Processing MoneyLost computation', { vertical });

    // Minimal proxy to existing math logic
    // NOTE: This is a conservative placeholder. Replace with real computation logic if available.
    const summary: MoneyLostOutput = {
      vertical,
      dailyTotalUsd: 0,
      monthlyTotalUsd: 0,
      annualTotalUsd: 0,
      areas: [],
      assumptions: ['Edge function placeholder – wire to real compute soon'],
      version: 'ml-edge-v1'
    };

    const processingTime = Date.now() - startTime;
    
    // Validate output
    const validatedOutput = MoneyLostOutputSchema.parse(summary);

    logger.info('MoneyLost computation completed', { 
      vertical, 
      processingTime,
      totalMonthly: validatedOutput.monthlyTotalUsd 
    });

    return new Response(JSON.stringify(validatedOutput), { 
      status: 200, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Processing-Time': `${processingTime}ms`
      }
    });

  } catch (error) {
    logger.error('MoneyLost computation error', { error: error.message });
    
    const processingTime = Date.now() - startTime;
    let errorResponse: ErrorResponse;

    if (error.name === 'ZodError') {
      errorResponse = {
        success: false,
        error: { 
          message: 'Invalid input format', 
          code: 'VALIDATION_ERROR',
          details: error.errors 
        },
        metadata: { processing_time_ms: processingTime }
      };

      return new Response(JSON.stringify(errorResponse), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    errorResponse = {
      success: false,
      error: { 
        message: error.message || 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      },
      metadata: { processing_time_ms: processingTime }
    };

    return new Response(JSON.stringify(errorResponse), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});