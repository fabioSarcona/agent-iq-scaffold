import { supabase } from '@/integrations/supabase/client';
import type { NeedAgentIQInput, NeedAgentIQInsight } from './types';
import { getKBSlicesForVertical } from '@/lib/kbClient';

// Track in-flight requests to handle race conditions
const inFlightRequests = new Map<string, AbortController>();

export async function requestNeedAgentIQ(payload: NeedAgentIQInput): Promise<NeedAgentIQInsight[]> {
  // Handle race condition - cancel previous request for same sectionId
  const requestKey = `${payload.auditId}-${payload.sectionId}`;
  const existingRequest = inFlightRequests.get(requestKey);
  if (existingRequest) {
    existingRequest.abort();
    inFlightRequests.delete(requestKey);
  }

  // Create new abort controller for this request
  const abortController = new AbortController();
  inFlightRequests.set(requestKey, abortController);

  try {
    // Get JWT token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    // Enrich payload with KB slices
    const kbSlices = getKBSlicesForVertical(payload.auditType);
    const enrichedPayload = {
      ...payload,
      kb: kbSlices
    };

    const res = await fetch('/functions/v1/ai_needagentiq', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(enrichedPayload),
      signal: abortController.signal
    });

    // Handle 204 or empty response
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return [];
    }

    if (!res.ok) {
      let errorMessage = 'NeedAgentIQ request failed';
      try {
        const errorData = await res.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // Use default error message if response is not JSON
      }
      throw new Error(errorMessage);
    }

    const insights = await res.json();
    return Array.isArray(insights) ? insights : [];

  } catch (error) {
    if (error.name === 'AbortError') {
      // Request was cancelled, don't throw
      return [];
    }
    throw error;
  } finally {
    // Clean up the request tracker
    inFlightRequests.delete(requestKey);
  }
}