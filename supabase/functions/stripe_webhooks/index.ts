import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders, getStripeClient, getSupabaseServiceClient, upsertBillingCustomer } from '../_shared/stripe.ts';

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOKS] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripe = getStripeClient();
    const supabase = getSupabaseServiceClient();
    
    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      throw new Error('No Stripe signature found');
    }

    // Verify the webhook signature (in production, set STRIPE_WEBHOOK_SECRET)
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;
    
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err.message });
        return new Response('Webhook signature verification failed', { status: 400 });
      }
    } else {
      // In development, just parse the body
      event = JSON.parse(body);
      logStep("Webhook parsed (no signature verification in development)");
    }

    logStep("Processing event", { type: event.type, id: event.id });

    // Handle different webhook events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription, supabase);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabase);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook handler", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleSubscriptionChange(subscription: Stripe.Subscription, supabase: any) {
  logStep("Handling subscription change", { subscriptionId: subscription.id, status: subscription.status });
  
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  
  // Find the user by Stripe customer ID
  const { data: billingCustomer, error } = await supabase
    .from('billing_customers')
    .select('user_id, email')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  
  if (error || !billingCustomer) {
    logStep("Customer not found in database", { customerId });
    return;
  }
  
  await upsertBillingCustomer({
    userId: billingCustomer.user_id,
    email: billingCustomer.email,
    stripeCustomerId: customerId,
    subscriptionId: subscription.id,
    priceId,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });
  
  logStep("Subscription updated in database");
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  logStep("Handling subscription deletion", { subscriptionId: subscription.id });
  
  const customerId = subscription.customer as string;
  
  const { error } = await supabase
    .from('billing_customers')
    .update({
      stripe_subscription_id: null,
      stripe_price_id: null,
      status: 'cancelled',
      current_period_start: null,
      current_period_end: null,
    })
    .eq('stripe_customer_id', customerId);
  
  if (error) {
    logStep("Failed to update cancelled subscription", { error: error.message });
  } else {
    logStep("Subscription cancelled in database");
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  logStep("Handling successful payment", { invoiceId: invoice.id });
  
  if (invoice.subscription) {
    const customerId = invoice.customer as string;
    
    const { error } = await supabase
      .from('billing_customers')
      .update({ status: 'active' })
      .eq('stripe_customer_id', customerId);
    
    if (!error) {
      logStep("Payment success updated in database");
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  logStep("Handling failed payment", { invoiceId: invoice.id });
  
  if (invoice.subscription) {
    const customerId = invoice.customer as string;
    
    const { error } = await supabase
      .from('billing_customers')
      .update({ status: 'past_due' })
      .eq('stripe_customer_id', customerId);
    
    if (!error) {
      logStep("Payment failure updated in database");
    }
  }
}