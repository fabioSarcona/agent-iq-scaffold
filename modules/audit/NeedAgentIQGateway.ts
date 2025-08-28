import { requestNeedAgentIQ } from '@modules/ai/needagentiq/client';
import { useNeedAgentIQStore } from '@modules/ai/needagentiq/store';
import { createKBSlice } from '@modules/ai/needagentiq/kb-access';
import { NeedAgentIQInput } from '@modules/ai/needagentiq/types';
import knowledgeBase from '@/kb';

/**
 * NeedAgentIQ Gateway - Orchestrates AI insight generation
 * Triggered when audit sections are completed
 */
export class NeedAgentIQGateway {
  private static instance: NeedAgentIQGateway;
  
  static getInstance(): NeedAgentIQGateway {
    if (!this.instance) {
      this.instance = new NeedAgentIQGateway();
    }
    return this.instance;
  }

  /**
   * Process completed audit section and generate insights
   */
  async processCompletedSection(
    auditId: string,
    auditType: 'dental' | 'hvac',
    sectionId: string,
    auditResponses: Array<{ key: string; value: any }>,
    businessContext?: {
      name: string;
      location?: string;
      size?: { chairs?: number; techs?: number };
    },
    moneyLostData?: {
      items: Array<{
        area: string;
        formula: string;
        assumptions: string[];
        resultMonthly: number;
        confidence: number;
      }>;
      totalMonthly: number;
    }
  ): Promise<void> {
    const store = useNeedAgentIQStore.getState();
    
    try {
      // Set loading state
      store.setLoading(sectionId, true);
      store.clearError(sectionId);

      // Build KB slice
      const kbSlice = createKBSlice(knowledgeBase, auditType);

      // Construct input payload
      const input: NeedAgentIQInput = {
        context: {
          auditId,
          auditType,
          sectionId,
          business: businessContext,
          settings: {
            currency: 'USD',
            locale: 'en-US'
          }
        },
        audit: {
          responses: auditResponses,
          // TODO: Add aiReadinessScore and sectionScores when available
        },
        moneyLost: moneyLostData,
        kb: {
          approved_claims: kbSlice.approved_claims,
          services: kbSlice.services
        }
      };

      // Call NeedAgentIQ
      const insights = await requestNeedAgentIQ(input);

      // Store results
      store.setInsights(sectionId, insights);
      
    } catch (error) {
      console.error('NeedAgentIQ Gateway error:', error);
      store.setError(sectionId, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      store.setLoading(sectionId, false);
    }
  }

  /**
   * Check if insights should be generated for a section
   */
  shouldGenerateInsights(
    sectionId: string,
    responses: Array<{ key: string; value: any }>
  ): boolean {
    // Generate insights if section has meaningful responses
    return responses.length > 0 && responses.some(r => r.value !== null && r.value !== undefined);
  }
}

// Export singleton instance
export const needAgentIQGateway = NeedAgentIQGateway.getInstance();