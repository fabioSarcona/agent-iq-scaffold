import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Calendar, User, ExternalLink } from 'lucide-react';
import { billingClient } from '../client';
import type { BillingCustomer, SubscriptionStatus } from '../types';

const PLAN_NAMES: Record<string, string> = {
  'price_starter_monthly': 'Starter',
  'price_growth_monthly': 'Growth', 
  'price_elite_monthly': 'Elite',
};

export function BillingStatusCard() {
  const [billingCustomer, setBillingCustomer] = useState<BillingCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBillingData = async () => {
    try {
      setError(null);
      const customer = await billingClient.getBillingCustomer();
      setBillingCustomer(customer);
    } catch (err) {
      console.error('Failed to load billing data:', err);
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async () => {
    try {
      setCreating(true);
      setError(null);
      await billingClient.createStripeCustomer();
      await loadBillingData();
    } catch (err) {
      console.error('Failed to create customer:', err);
      setError('Failed to create billing customer');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trialing':
        return 'secondary';
      case 'past_due':
      case 'cancelled':
      case 'unpaid':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading billing information...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>{error}</p>
            <Button 
              onClick={loadBillingData} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!billingCustomer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Setup
          </CardTitle>
          <CardDescription>
            Set up your billing account to manage subscriptions and payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={createCustomer} 
            disabled={creating}
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Setting up...
              </>
            ) : (
              <>
                <User className="h-4 w-4 mr-2" />
                Set up billing account
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Billing Information
        </CardTitle>
        <CardDescription>
          Your current billing status and subscription details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {billingCustomer.stripe_price_id && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Plan:</span>
              <Badge variant="default">
                {PLAN_NAMES[billingCustomer.stripe_price_id] || 'Unknown Plan'}
              </Badge>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={getStatusColor(billingCustomer.status)}>
              {billingCustomer.status}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Email:</span>
            <span className="text-sm text-muted-foreground">{billingCustomer.email}</span>
          </div>
          
          {billingCustomer.stripe_customer_id && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Customer ID:</span>
              <span className="text-sm font-mono text-muted-foreground">
                {billingCustomer.stripe_customer_id.slice(0, 20)}...
              </span>
            </div>
          )}
          
          {billingCustomer.stripe_subscription_id && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Subscription:</span>
              <span className="text-sm font-mono text-muted-foreground">
                {billingCustomer.stripe_subscription_id.slice(0, 20)}...
              </span>
            </div>
          )}
          
          {billingCustomer.current_period_end && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Next billing:
              </span>
              <span className="text-sm text-muted-foreground">
                {formatDate(billingCustomer.current_period_end)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={loadBillingData} 
            variant="outline" 
            size="sm"
          >
            Refresh
          </Button>
          {billingCustomer.stripe_customer_id && (
            <Button 
              size="sm" 
              onClick={() => console.log('Open customer portal')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Manage Billing
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}