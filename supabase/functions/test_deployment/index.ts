import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { normalizeError } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    console.log('Test deployment function called successfully');
    
    const response = {
      success: true,
      message: 'Test deployment function is working correctly',
      timestamp: new Date().toISOString()
    };

    console.log('Test deployment response:', response);
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Test deployment error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: { message: normalizeError(error).message || 'Internal server error' }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});