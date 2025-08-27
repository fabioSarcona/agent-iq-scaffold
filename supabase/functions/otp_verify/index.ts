import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

type Body = { email: string; code: string };

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256(s: string) {
  const data = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
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
    const { email, code } = await req.json() as Body;
    
    if (!email || !code) {
      return new Response(JSON.stringify({ verified: false, error: 'Missing fields' }), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ verified: false, error: 'Invalid code format' }), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const { data: row } = await sb
      .from('email_otp')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!row) {
      return new Response(JSON.stringify({ verified: false, error: 'No code found' }), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (row.consumed_at) {
      return new Response(JSON.stringify({ verified: false, error: 'Code already used' }), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ verified: false, error: 'Code expired' }), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const hash = await sha256(code);
    if (hash !== row.code_hash) {
      return new Response(JSON.stringify({ verified: false, error: 'Invalid code' }), { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Mark OTP as consumed
    await sb
      .from('email_otp')
      .update({ consumed_at: new Date().toISOString() })
      .eq('email', email);

    return new Response(JSON.stringify({ verified: true }), { 
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error in otp_verify:', error);
    return new Response(JSON.stringify({ verified: false, error: 'Internal server error' }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});