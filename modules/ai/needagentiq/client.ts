import { NeedAgentIQInput, NeedAgentIQInsights, NeedAgentIQInsightsSchema } from './types';

/**
 * Request NeedAgentIQ insights from the edge function
 */
export async function requestNeedAgentIQ(input: NeedAgentIQInput): Promise<NeedAgentIQInsights> {
  const response = await fetch('/functions/v1/ai_needagentiq', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`NeedAgentIQ failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Validate the response data
  return NeedAgentIQInsightsSchema.parse(data);
}