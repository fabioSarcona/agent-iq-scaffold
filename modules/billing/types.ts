export interface BillingCustomer {
  id: string;
  user_id: string;
  email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerResponse {
  stripe_customer_id: string;
  created?: boolean;
  already_exists?: boolean;
}

export type SubscriptionStatus = 
  | 'active' 
  | 'trialing' 
  | 'past_due' 
  | 'cancelled' 
  | 'unpaid' 
  | 'incomplete' 
  | 'inactive';

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  recommended?: boolean;
}