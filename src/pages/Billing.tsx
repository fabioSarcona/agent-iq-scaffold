import { useState } from 'react';
import { BillingStatusCard, PricingPlans } from '../../modules/billing';
import type { PricingPlan } from '../../modules/billing';

// Sample pricing plans - these would typically come from your backend/Stripe
const SAMPLE_PLANS: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for small businesses getting started',
    price: 2900, // $29.00 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Up to 5 audits per month',
      'Basic AI insights',
      'Email support',
      'Standard reports'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Ideal for growing businesses',
    price: 4900, // $49.00 in cents
    currency: 'usd',
    interval: 'month',
    recommended: true,
    features: [
      'Unlimited audits',
      'Advanced AI insights',
      'Priority support',
      'Custom reports',
      'API access',
      'Team collaboration'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    price: 9900, // $99.00 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Everything in Professional',
      'Custom AI training',
      'Dedicated support',
      'SLA guarantee',
      'Custom integrations',
      'Advanced analytics'
    ]
  }
];

export function Billing() {
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    setLoading(true);
    try {
      // TODO: Implement checkout flow
      console.log('Selected plan:', planId);
      setSelectedPlan(planId);
      
      // This is where you would create a Stripe checkout session
      // await createCheckoutSession(planId);
      
    } catch (error) {
      console.error('Error selecting plan:', error);
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
          plans={SAMPLE_PLANS}
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