import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

// Shared modules
import { getEnv, corsHeaders } from '../_shared/env.ts';
import { logger } from '../_shared/logger.ts';
import { normalizeError } from '../_shared/errorUtils.ts';
import { z } from '../_shared/zod.ts';
import { OTPRequestInputSchema, OTPRequestOutputSchema } from '../_shared/validation.ts';
import type { OTPRequestInput, OTPRequestOutput, ErrorResponse } from '../_shared/types.ts';

// Environment setup
const env = getEnv();
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY'); // optional — logs OTP if missing
const supabaseUrl = env.SUPABASE_URL!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

// Constants
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const COOLDOWN_SECONDS = 60;
const EXPIRES_MIN = 5; // Reduced from 10 to 5 minutes for better security
const RATE_WINDOW_MIN = 10;
const RATE_MAX_PER_IP = 3;      // per 10 minutes
const RATE_MAX_PER_EMAIL_DAY = 10;

function isDisposable(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1] ?? '';
  const disposable = [
    'mailinator.com', 'guerrillamail.com', '10minutemail.com', 
    'tempmail.com', 'yopmail.com', 'discard.email', 
    'trashmail.com', 'sharklasers.com'
  ];
  return disposable.includes(domain);
}

function sixDigits(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sha256(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sendEmail(email: string, code: string): Promise<void> {
  if (!RESEND_API_KEY) { 
    logger.info('DEV mode - OTP code', { email, code }); 
    return; 
  }
  
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${RESEND_API_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        from: "NeedAgent AI <no-reply@needagent.ai>",
        to: [email],
        subject: "Your NeedAgent verification code",
        text: `Your 6-digit verification code is ${code}. It expires in ${EXPIRES_MIN} minutes. Do not share this code with anyone.`
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Failed to send email', { status: response.status, error: errorText });
    } else {
      logger.info('Email sent successfully', { email });
    }
  } catch (error) {
    logger.error('Email sending error', error);
  }
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
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';
    const body = await req.json();
    
    // Validate input
    const { email } = OTPRequestInputSchema.parse(body);

    logger.info('OTP request received', { email, ip });

    if (isDisposable(email)) {
      const response: OTPRequestOutput = {
        ok: false,
        cooldownSeconds: 0,
        expiresInMinutes: 0,
        error: 'Disposable emails are not allowed'
      };

      return new Response(JSON.stringify(response), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Check IP rate limiting
    const { data: recentByIp } = await sb
      .from('otp_requests')
      .select('id, requested_at')
      .gte('requested_at', new Date(Date.now() - RATE_WINDOW_MIN*60*1000).toISOString())
      .eq('ip', ip);
      
    if ((recentByIp?.length ?? 0) >= RATE_MAX_PER_IP) {
      const response: OTPRequestOutput = {
        ok: false,
        cooldownSeconds: 0,
        expiresInMinutes: 0,
        error: 'Too many requests from this IP. Please wait.'
      };

      return new Response(JSON.stringify(response), { 
        status: 429, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Check email rate limiting
    const { data: recentByEmail } = await sb
      .from('otp_requests')
      .select('id, requested_at')
      .gte('requested_at', new Date(Date.now() - 24*60*60*1000).toISOString())
      .eq('email', email);
      
    if ((recentByEmail?.length ?? 0) >= RATE_MAX_PER_EMAIL_DAY) {
      const response: OTPRequestOutput = {
        ok: false,
        cooldownSeconds: 0,
        expiresInMinutes: 0,
        error: 'Daily limit reached for this email.'
      };

      return new Response(JSON.stringify(response), { 
        status: 429, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Check cooldown period
    const { data: lastReq } = await sb
      .from('otp_requests')
      .select('requested_at')
      .eq('email', email)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (lastReq?.requested_at && Date.now() - new Date(lastReq.requested_at).getTime() < COOLDOWN_SECONDS*1000) {
      const response: OTPRequestOutput = {
        ok: false,
        cooldownSeconds: COOLDOWN_SECONDS,
        expiresInMinutes: 0,
        error: 'Please wait before requesting a new code.'
      };

      return new Response(JSON.stringify(response), { 
        status: 429, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Generate and store OTP
    const code = sixDigits();
    const code_hash = await sha256(code);
    const expires = new Date(Date.now() + EXPIRES_MIN*60*1000).toISOString();

    await sb.from('email_otp').upsert({
      email, 
      code_hash, 
      requested_at: new Date().toISOString(), 
      expires_at: expires, 
      consumed_at: null
    });

    await sb.from('otp_requests').insert({ email, ip });
    await sendEmail(email, code);

    const response: OTPRequestOutput = {
      ok: true, 
      cooldownSeconds: COOLDOWN_SECONDS, 
      expiresInMinutes: EXPIRES_MIN 
    };

    const processingTime = Date.now() - startTime;
    logger.info('OTP request processed successfully', { email, processingTime });

    return new Response(JSON.stringify(response), {
      headers: { 
        "Content-Type": "application/json", 
        ...corsHeaders,
        'X-Processing-Time': `${processingTime}ms`
      }
    });
    
  } catch (error) {
    logger.error('Error in otp_request', error);
    
    const processingTime = Date.now() - startTime;
    let errorResponse: ErrorResponse;

    if (error instanceof z.ZodError) {
      const err = normalizeError(error);
      errorResponse = {
        success: false,
        error: { 
          message: 'Invalid input format', 
          code: 'VALIDATION_ERROR',
          details: err.zodIssues 
        },
        metadata: { processing_time_ms: processingTime }
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    errorResponse = {
      success: false,
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      metadata: { processing_time_ms: processingTime }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});