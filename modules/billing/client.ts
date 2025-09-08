import { supabase } from '@/integrations/supabase/client';
import type { BillingCustomer, CreateCustomerResponse } from './types';

export class BillingClient {
  async getBillingCustomer(): Promise<BillingCustomer | null> {
    const { data, error } = await supabase
      .from('billing_customers')
      .select('*')
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching billing customer:', error);
      throw error;
    }
    
    return data;
  }
  
  async createStripeCustomer(email?: string, metadata?: Record<string, string>): Promise<CreateCustomerResponse> {
    const { data, error } = await supabase.functions.invoke('stripe_create_customer', {
      body: { email, metadata }
    });
    
    if (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
    
    return data;
  }
  
  async refreshBillingData(): Promise<void> {
    // This would typically call an edge function that syncs with Stripe
    // For now, we'll just refetch the data
    const customer = await this.getBillingCustomer();
    return Promise.resolve();
  }
}

export const billingClient = new BillingClient();