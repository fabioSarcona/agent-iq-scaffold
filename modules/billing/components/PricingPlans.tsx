import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import type { PricingPlan } from '../types';

interface PricingPlansProps {
  plans: PricingPlan[];
  currentPlanId?: string;
  onSelectPlan?: (planId: string) => void;
  loading?: boolean;
}

export function PricingPlans({ plans, currentPlanId, onSelectPlan, loading = false }: PricingPlansProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <Card 
          key={plan.id} 
          className={`relative ${plan.recommended ? 'border-primary' : ''}`}
        >
          {plan.recommended && (
            <Badge 
              className="absolute -top-2 left-1/2 -translate-x-1/2"
              variant="default"
            >
              Recommended
            </Badge>
          )}
          
          <CardHeader>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
            <div className="flex items-baseline gap-1 pt-2">
              <span className="text-3xl font-bold">
                {formatPrice(plan.price, plan.currency)}
              </span>
              <span className="text-sm text-muted-foreground">
                /{plan.interval}
              </span>
            </div>
          </CardHeader>
          
          <CardContent>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          
          <CardFooter>
            <Button
              className="w-full"
              variant={currentPlanId === plan.id ? "outline" : "default"}
              onClick={() => onSelectPlan?.(plan.id)}
              disabled={loading || currentPlanId === plan.id}
            >
              {currentPlanId === plan.id 
                ? "Current Plan" 
                : "Select Plan"
              }
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}