import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NeedAgentIQInsight } from './types';

interface NeedAgentIQState {
  // Insights organized by section
  insightsBySection: Record<string, NeedAgentIQInsight[]>;
  
  // Loading states
  loadingStates: Record<string, boolean>;
  
  // Error states
  errors: Record<string, string>;
  
  // Actions
  setInsights: (sectionId: string, insights: NeedAgentIQInsight[]) => void;
  setLoading: (sectionId: string, loading: boolean) => void;
  setError: (sectionId: string, error: string) => void;
  clearError: (sectionId: string) => void;
  clearInsights: (sectionId: string) => void;
  clearAll: () => void;
  
  // Getters
  getInsights: (sectionId: string) => NeedAgentIQInsight[];
  isLoading: (sectionId: string) => boolean;
  hasError: (sectionId: string) => boolean;
  getError: (sectionId: string) => string | undefined;
}

export const useNeedAgentIQStore = create<NeedAgentIQState>()(
  persist(
    (set, get) => ({
      insightsBySection: {},
      loadingStates: {},
      errors: {},
      
      setInsights: (sectionId: string, insights: NeedAgentIQInsight[]) =>
        set((state) => ({
          insightsBySection: {
            ...state.insightsBySection,
            [sectionId]: insights
          }
        })),
      
      setLoading: (sectionId: string, loading: boolean) =>
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [sectionId]: loading
          }
        })),
      
      setError: (sectionId: string, error: string) =>
        set((state) => ({
          errors: {
            ...state.errors,
            [sectionId]: error
          }
        })),
      
      clearError: (sectionId: string) =>
        set((state) => {
          const { [sectionId]: _, ...restErrors } = state.errors;
          return { errors: restErrors };
        }),
      
      clearInsights: (sectionId: string) =>
        set((state) => {
          const { [sectionId]: _, ...restInsights } = state.insightsBySection;
          return { insightsBySection: restInsights };
        }),
      
      clearAll: () =>
        set({
          insightsBySection: {},
          loadingStates: {},
          errors: {}
        }),
      
      // Getters
      getInsights: (sectionId: string) => get().insightsBySection[sectionId] || [],
      isLoading: (sectionId: string) => get().loadingStates[sectionId] || false,
      hasError: (sectionId: string) => Boolean(get().errors[sectionId]),
      getError: (sectionId: string) => get().errors[sectionId]
    }),
    {
      name: 'needagentiq-store',
      partialize: (state) => ({ insightsBySection: state.insightsBySection })
    }
  )
);