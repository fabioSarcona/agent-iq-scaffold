import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

// Shared modules
import { getEnv, corsHeaders } from '../_shared/env.ts';
import { logger } from '../_shared/logger.ts';
import { OTPVerifyInputSchema, OTPVerifyOutputSchema } from '../_shared/validation.ts';
import type { OTPVerifyInput, OTPVerifyOutput, ErrorResponse } from '../_shared/types.ts';

// Environment setup
const env = getEnv();
const supabaseUrl = env.SUPABASE_URL!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function sha256(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  const startTime = Date.now();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    const errorResponse: ErrorResponse = {
      success: false,
      error: { message: 'Method Not Allowed', code: 'METHOD_NOT_ALLOWED' },
      metadata: { processing_time_ms: Date.now() - startTime }
    };

    return new Response(JSON.stringify(errorResponse), { 
      status: 405, 
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const { email, code } = OTPVerifyInputSchema.parse(body);

    logger.info('OTP verification request received', { email });

    const { data: row } = await sb
      .from('email_otp')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!row) {
      const response: OTPVerifyOutput = {
        verified: false, 
        error: 'No code found'
      };

      return new Response(JSON.stringify(response), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (row.consumed_at) {
      const response: OTPVerifyOutput = {
        verified: false, 
        error: 'Code already used'
      };

      return new Response(JSON.stringify(response), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      const response: OTPVerifyOutput = {
        verified: false, 
        error: 'Code expired'
      };

      return new Response(JSON.stringify(response), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const hash = await sha256(code);
    if (hash !== row.code_hash) {
      const response: OTPVerifyOutput = {
        verified: false, 
        error: 'Invalid code'
      };

      logger.warn('Invalid OTP code provided', { email });

      return new Response(JSON.stringify(response), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Mark OTP as consumed
    await sb
      .from('email_otp')
      .update({ consumed_at: new Date().toISOString() })
      .eq('email', email);

    const response: OTPVerifyOutput = { verified: true };
    const processingTime = Date.now() - startTime;

    logger.info('OTP verification successful', { email, processingTime });

    return new Response(JSON.stringify(response), { 
      headers: { 
        "Content-Type": "application/json", 
        ...corsHeaders,
        'X-Processing-Time': `${processingTime}ms`
      }
    });
    
  } catch (error) {
    logger.error('Error in otp_verify', { error: error.message });
    
    const processingTime = Date.now() - startTime;
    let errorResponse: ErrorResponse;

    if (error.name === 'ZodError') {
      const response: OTPVerifyOutput = {
        verified: false, 
        error: 'Invalid input format'
      };

      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const response: OTPVerifyOutput = {
      verified: false, 
      error: 'Internal server error'
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});