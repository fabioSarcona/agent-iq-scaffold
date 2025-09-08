import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, createStripeCustomer, upsertBillingCustomer } from '../_shared/stripe.ts';

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CUSTOMER] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const body = await req.json();
    const { email, metadata } = body;

    // Use authenticated user's email if not provided
    const customerEmail = email || user.email;

    // Check if customer already exists in our database
    const { data: existingCustomer } = await supabaseClient
      .from('billing_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingCustomer?.stripe_customer_id) {
      logStep("Customer already exists", { stripeCustomerId: existingCustomer.stripe_customer_id });
      return new Response(JSON.stringify({ 
        stripe_customer_id: existingCustomer.stripe_customer_id,
        already_exists: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create new Stripe customer
    const stripeCustomerId = await createStripeCustomer({
      email: customerEmail,
      userId: user.id,
      metadata,
    });

    logStep("Stripe customer created", { stripeCustomerId });

    // Store in our database
    await upsertBillingCustomer({
      userId: user.id,
      email: customerEmail,
      stripeCustomerId,
    });

    logStep("Billing customer stored in database");

    return new Response(JSON.stringify({ 
      stripe_customer_id: stripeCustomerId,
      created: true 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-customer", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});