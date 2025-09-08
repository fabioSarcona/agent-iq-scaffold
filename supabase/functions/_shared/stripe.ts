// Shared Stripe utilities for edge functions
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export { corsHeaders };

export function getStripeClient(): Stripe {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  
  return new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
  });
}

export function getSupabaseServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables not configured');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
}

export async function createStripeCustomer(params: {
  email: string;
  userId: string;
  metadata?: Record<string, string>;
}): Promise<string> {
  const stripe = getStripeClient();
  
  const customer = await stripe.customers.create({
    email: params.email,
    metadata: {
      user_id: params.userId,
      ...params.metadata,
    },
  });
  
  return customer.id;
}

export async function upsertBillingCustomer(params: {
  userId: string;
  email: string;
  stripeCustomerId: string;
  subscriptionId?: string;
  priceId?: string;
  status?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}) {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('billing_customers')
    .upsert({
      user_id: params.userId,
      email: params.email,
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.subscriptionId,
      stripe_price_id: params.priceId,
      status: params.status || 'inactive',
      current_period_start: params.currentPeriodStart?.toISOString(),
      current_period_end: params.currentPeriodEnd?.toISOString(),
    }, { onConflict: 'user_id' });
  
  if (error) {
    throw new Error(`Failed to upsert billing customer: ${error.message}`);
  }
  
  return data;
}