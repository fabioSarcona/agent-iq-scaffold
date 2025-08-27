import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

type Body = { email: string };
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY'); // optional — logs OTP if missing
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const COOLDOWN_SECONDS = 60;
const EXPIRES_MIN = 5; // Reduced from 10 to 5 minutes for better security
const RATE_WINDOW_MIN = 10;
const RATE_MAX_PER_IP = 3;      // per 10 minutes
const RATE_MAX_PER_EMAIL_DAY = 10;

function isDisposable(email: string) {
  const domain = email.toLowerCase().split('@')[1] ?? '';
  const disposable = ['mailinator.com','guerrillamail.com','10minutemail.com','tempmail.com','yopmail.com','discard.email','trashmail.com','sharklasers.com'];
  return disposable.includes(domain);
}

function sixDigits() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sha256(s: string) {
  const data = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function sendEmail(email: string, code: string) {
  if (!RESEND_API_KEY) { 
    console.log(`DEV OTP for ${email}: ${code}`); 
    return; 
  }
  
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
    console.error('Failed to send email:', await response.text());
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
      status: 405, 
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';
    const { email } = await req.json() as Body;

    if (!EMAIL_RX.test(email || '')) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    if (isDisposable(email)) {
      return new Response(JSON.stringify({ error: 'Disposable emails are not allowed' }), { 
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
      return new Response(JSON.stringify({ error: 'Too many requests from this IP. Please wait.' }), { 
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
      return new Response(JSON.stringify({ error: 'Daily limit reached for this email.' }), { 
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
      return new Response(JSON.stringify({ error: 'Please wait before requesting a new code.' }), { 
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

    return new Response(JSON.stringify({ 
      ok: true, 
      cooldownSeconds: COOLDOWN_SECONDS, 
      expiresInMinutes: EXPIRES_MIN 
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error in otp_request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});