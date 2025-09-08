import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BillingStatusCard, PricingPlans } from '../../modules/billing';
import type { PricingPlan } from '../../modules/billing';
import { useToast } from '@/hooks/use-toast';

// Pricing plans with actual Stripe price IDs
const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses getting started',
    price: 4900, // $49.00 in cents
    currency: 'usd',
    interval: 'month',
    stripe_price_id: 'price_starter_monthly', // Replace with actual Stripe price ID
    features: [
      'Up to 50 audits per month',
      'Basic AI insights',
      'Email support',
      'Standard reports',
      'Dashboard analytics'
    ]
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Ideal for growing businesses',
    price: 9900, // $99.00 in cents
    currency: 'usd',
    interval: 'month',
    stripe_price_id: 'price_growth_monthly', // Replace with actual Stripe price ID
    recommended: true,
    features: [
      'Unlimited audits',
      'Advanced AI insights',
      'Priority support',
      'Custom reports',
      'API access',
      'Team collaboration',
      'White-label options'
    ]
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'For large organizations with custom needs',
    price: 19900, // $199.00 in cents
    currency: 'usd',
    interval: 'month',
    stripe_price_id: 'price_elite_monthly', // Replace with actual Stripe price ID
    features: [
      'Everything in Growth',
      'Custom AI training',
      'Dedicated support manager',
      'SLA guarantee',
      'Custom integrations',
      'Advanced analytics',
      'Multi-tenant deployment'
    ]
  }
];

export function Billing() {
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check for success/cancel URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Subscription successful!",
        description: "Your subscription has been activated.",
      });
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      toast({
        title: "Subscription canceled",
        description: "You can try again anytime.",
        variant: "destructive",
      });
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const handleSelectPlan = async (planId: string) => {
    setLoading(true);
    try {
      const plan = PRICING_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      const { data, error } = await supabase.functions.invoke('stripe_checkout', {
        body: { price_id: plan.stripe_price_id }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      if (data?.checkout_url) {
        window.open(data.checkout_url, '_blank');
      }
      
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Billing & Subscriptions</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Manage your billing information and choose the plan that best fits your business needs.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <BillingStatusCard />
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Choose Your Plan</h2>
          <p className="text-muted-foreground mt-2">
            Upgrade or change your subscription plan anytime.
          </p>
        </div>
        
        <PricingPlans 
          plans={PRICING_PLANS}
          currentPlanId={selectedPlan}
          onSelectPlan={handleSelectPlan}
          loading={loading}
        />
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          All plans include a 14-day free trial. Cancel anytime.
        </p>
      </div>
    </div>
  );
}