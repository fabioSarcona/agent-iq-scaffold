import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuditConfig, AuditSection, AuditQuestion, ScoreSummary } from './types';
import type { NeedAgentIQInsight } from 'supabase/functions/_shared/types';
import { computeScores } from './scoring';
import { logger } from '@/lib/logger';

interface AuditProgressState {
  // Current position
  currentSectionIndex: number;
  currentQuestionIndex: number;
  
  // Data
  answers: Record<string, unknown>;
  logsEnabled: boolean;
  vertical: 'dental' | 'hvac';
  scoreSummary: ScoreSummary;
  
  // NeedAgentIQ insights
  insights: NeedAgentIQInsight[];
  lastEmittedKeys: string[];
  iqError?: string | null;
  insightsBySection: Record<string, NeedAgentIQInsight[]>;
  iqErrorBySection: Record<string, string | null>;
  
  // Config
  config: AuditConfig | null;
  currentSection: AuditSection | null;
  currentQuestion: AuditQuestion | null;
  
  // Actions
  setVertical: (vertical: 'dental' | 'hvac') => void;
  loadConfig: (config: AuditConfig) => void;
  setAnswer: (questionId: string, value: unknown) => void;
  setScoreSummary: (summary: ScoreSummary) => void;
  next: () => void;
  back: () => void;
  restart: () => void;
  toggleLogs: () => void;
  
  // NeedAgentIQ actions
  appendInsights: (sectionId: string, newInsights: NeedAgentIQInsight[]) => void;
  populateInsightsFromROIBrain: (insights: NeedAgentIQInsight[]) => void;
  clearIqError: () => void;
  setIqError: (sectionId: string, error: string | null) => void;
  
  // Computed helpers
  getTotalQuestions: () => number;
  getCurrentQuestionNumber: () => number;
  getProgressPercentage: () => number;
  isAtEnd: () => boolean;
  canGoBack: () => boolean;
  isSectionComplete: (sectionIndex: number) => boolean;
}

const logEvent = (logsEnabled: boolean, event: string, data?: Record<string, unknown>) => {
  if (logsEnabled) {
    logger.info(`[AUDIT LOG] ${event}`, data || {});
  }
};

export const useAuditProgressStore = create<AuditProgressState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      answers: {},
      logsEnabled: false,
      vertical: 'dental',
      scoreSummary: { overall: 0, sections: [] },
      insights: [],
      lastEmittedKeys: [],
      iqError: null,
      insightsBySection: {},
      iqErrorBySection: {},
      config: null,
      currentSection: null,
      currentQuestion: null,

      // Actions
      setVertical: (vertical) => {
        set({ vertical });
        logEvent(get().logsEnabled, 'vertical_change', { vertical });
      },

      loadConfig: (config) => {
        const state = get();
        set({ 
          config,
          currentSection: config.sections[0] || null,
          currentQuestion: config.sections[0]?.questions[0] || null
        });
        
        logEvent(state.logsEnabled, 'config_loaded', { 
          vertical: config.vertical, 
          sections: config.sections.length 
        });
        
        if (config.sections[0]) {
          logEvent(state.logsEnabled, 'section_enter', { 
            sectionId: config.sections[0].id 
          });
        }
        
        if (config.sections[0]?.questions[0]) {
          logEvent(state.logsEnabled, 'question_view', { 
            questionId: config.sections[0].questions[0].id 
          });
        }
      },

      setAnswer: (questionId, value) => {
        const state = get();
        const newAnswers = { ...state.answers, [questionId]: value };
        set({ answers: newAnswers });
        
        // Recompute scores
        if (state.config) {
          const newScores = computeScores(state.config, newAnswers);
          set({ scoreSummary: newScores });
        }
        
        logEvent(state.logsEnabled, 'answer_submit', { questionId, value });
      },

      setScoreSummary: (summary) => {
        set({ scoreSummary: summary });
      },

      next: () => {
        const state = get();
        if (!state.config) return;

        const currentSection = state.config.sections[state.currentSectionIndex];
        if (!currentSection) return;

        const fromPosition = { 
          s: state.currentSectionIndex, 
          q: state.currentQuestionIndex 
        };

        // Check if we're at the last question of the current section
        if (state.currentQuestionIndex < currentSection.questions.length - 1) {
          // Move to next question in same section
          const newQuestionIndex = state.currentQuestionIndex + 1;
          const newQuestion = currentSection.questions[newQuestionIndex];
          
          set({
            currentQuestionIndex: newQuestionIndex,
            currentQuestion: newQuestion
          });

          const toPosition = { s: state.currentSectionIndex, q: newQuestionIndex };
          logEvent(state.logsEnabled, 'step_transition', { from: fromPosition, to: toPosition });
          logEvent(state.logsEnabled, 'question_view', { questionId: newQuestion.id });
        } else {
          // Move to next section
          const newSectionIndex = state.currentSectionIndex + 1;
          if (newSectionIndex < state.config.sections.length) {
            const newSection = state.config.sections[newSectionIndex];
            const newQuestion = newSection.questions[0];
            
            set({
              currentSectionIndex: newSectionIndex,
              currentQuestionIndex: 0,
              currentSection: newSection,
              currentQuestion: newQuestion
            });

            const toPosition = { s: newSectionIndex, q: 0 };
            logEvent(state.logsEnabled, 'step_transition', { from: fromPosition, to: toPosition });
            logEvent(state.logsEnabled, 'section_enter', { sectionId: newSection.id });
            logEvent(state.logsEnabled, 'question_view', { questionId: newQuestion.id });
          }
        }
      },

      back: () => {
        const state = get();
        if (!state.config) return;

        const fromPosition = { 
          s: state.currentSectionIndex, 
          q: state.currentQuestionIndex 
        };

        // Check if we're at the first question of the current section
        if (state.currentQuestionIndex > 0) {
          // Move to previous question in same section
          const newQuestionIndex = state.currentQuestionIndex - 1;
          const currentSection = state.config.sections[state.currentSectionIndex];
          const newQuestion = currentSection.questions[newQuestionIndex];
          
          set({
            currentQuestionIndex: newQuestionIndex,
            currentQuestion: newQuestion
          });

          const toPosition = { s: state.currentSectionIndex, q: newQuestionIndex };
          logEvent(state.logsEnabled, 'step_transition', { from: fromPosition, to: toPosition });
          logEvent(state.logsEnabled, 'back_click');
          logEvent(state.logsEnabled, 'question_view', { questionId: newQuestion.id });
        } else {
          // Move to previous section (last question)
          const newSectionIndex = state.currentSectionIndex - 1;
          if (newSectionIndex >= 0) {
            const newSection = state.config.sections[newSectionIndex];
            const newQuestionIndex = newSection.questions.length - 1;
            const newQuestion = newSection.questions[newQuestionIndex];
            
            set({
              currentSectionIndex: newSectionIndex,
              currentQuestionIndex: newQuestionIndex,
              currentSection: newSection,
              currentQuestion: newQuestion
            });

            const toPosition = { s: newSectionIndex, q: newQuestionIndex };
            logEvent(state.logsEnabled, 'step_transition', { from: fromPosition, to: toPosition });
            logEvent(state.logsEnabled, 'back_click');
            logEvent(state.logsEnabled, 'section_enter', { sectionId: newSection.id });
            logEvent(state.logsEnabled, 'question_view', { questionId: newQuestion.id });
          }
        }
      },

      restart: () => {
        const state = get();
        if (!state.config) return;

        const firstSection = state.config.sections[0];
        const firstQuestion = firstSection?.questions[0];

        set({
          currentSectionIndex: 0,
          currentQuestionIndex: 0,
          answers: {},
          scoreSummary: { overall: 0, sections: [] },
          // Clear all insights on restart
          insights: [],
          lastEmittedKeys: [],
          iqError: null,
          insightsBySection: {},
          iqErrorBySection: {},
          currentSection: firstSection || null,
          currentQuestion: firstQuestion || null
        });

        logEvent(state.logsEnabled, 'restart');
        logEvent(state.logsEnabled, 'insights_cleared');
        
        if (firstSection) {
          logEvent(state.logsEnabled, 'section_enter', { sectionId: firstSection.id });
        }
        
        if (firstQuestion) {
          logEvent(state.logsEnabled, 'question_view', { questionId: firstQuestion.id });
        }
      },

      toggleLogs: () => {
        set((state) => ({ logsEnabled: !state.logsEnabled }));
        const newState = get();
        logger.info(`Audit logging ${newState.logsEnabled ? 'enabled' : 'disabled'}`);
      },

      // NeedAgentIQ actions
      appendInsights: (sectionId, newInsights) => {
        // 🐛 DEBUG: Frontend insights received
        console.log('🐛 DEBUG: appendInsights called:', {
          sectionId,
          newInsightsCount: newInsights.length,
          newInsights: newInsights,
          timestamp: new Date().toISOString()
        });
        
        set((state) => {
          const prev = state.insightsBySection[sectionId] ?? [];
          const seen = new Set(prev.map(i => i.key.trim().toLowerCase()));
          
          console.log('🐛 DEBUG: Existing insights for section:', {
            sectionId,
            existingCount: prev.length,
            existingKeys: prev.map(i => i.key)
          });
          
          const merged = [
            ...prev,
            ...newInsights.filter(insight => {
              const k = insight.key.trim().toLowerCase();
              if (seen.has(k)) {
                console.log('🐛 DEBUG: Filtering duplicate insight:', { key: insight.key, sectionId });
                return false;
              }
              seen.add(k);
              return true;
            })
          ];
          
          console.log('🐛 DEBUG: After deduplication:', {
            sectionId,
            mergedCount: merged.length,
            addedCount: merged.length - prev.length
          });
          
          // Also update legacy insights array for backward compatibility
          const existingKeys = new Set(state.insights.map(i => i.key));
          const withMeta = newInsights.map(i => ({
            ...i,
            createdAt: i.createdAt ?? Date.now()
          }));
          const dedupedInsights = withMeta.filter(insight => !existingKeys.has(insight.key));
          const allInsights = [...state.insights, ...dedupedInsights];
          
          console.log('🐛 DEBUG: Legacy insights updated:', {
            totalInsights: allInsights.length,
            addedToLegacy: dedupedInsights.length
          });
          
          return {
            insightsBySection: { ...state.insightsBySection, [sectionId]: merged },
            insights: allInsights,
            lastEmittedKeys: [...state.lastEmittedKeys, ...dedupedInsights.map(i => i.key)]
          };
        });
        
        logEvent(get().logsEnabled, 'insights_received', { 
          sectionId, 
          count: newInsights.length,
          keys: newInsights.map(i => i.key)
        });
      },
      
      // FASE 2.1: Populate insights from ROI Brain (bypassing per-section logic)
      populateInsightsFromROIBrain: (roiBrainInsights) => {
        console.log('🧠 DEBUG: populateInsightsFromROIBrain called:', {
          insightsCount: roiBrainInsights.length,
          insights: roiBrainInsights,
          source: 'ROI_BRAIN',
          timestamp: new Date().toISOString()
        });
        
        set((state) => {
          // Group insights by sectionId for organized storage
          const newInsightsBySection = { ...state.insightsBySection };
          const allInsights = [...state.insights];
          const existingKeys = new Set(state.insights.map(i => i.key));
          
          roiBrainInsights.forEach(insight => {
            const sectionId = insight.sectionId || 'general';
            
            // Add to section-specific storage
            if (!newInsightsBySection[sectionId]) {
              newInsightsBySection[sectionId] = [];
            }
            
            // Check for duplicates in section
            const sectionExists = newInsightsBySection[sectionId].some(existing => 
              existing.key === insight.key
            );
            
            if (!sectionExists) {
              newInsightsBySection[sectionId].push(insight);
              
              // Add to global insights if not already present
              if (!existingKeys.has(insight.key)) {
                allInsights.push(insight);
                existingKeys.add(insight.key);
              }
            }
          });
          
          // Add timestamps and deduplicate ROI Brain insights
          const withMeta = roiBrainInsights.map(i => ({
            ...i,
            createdAt: i.createdAt ?? Date.now()
          }));
          const orderedInsights = [...withMeta, ...allInsights.slice(-10)];
          
          console.log('🧠 DEBUG: ROI Brain insights processed:', {
            totalInsights: orderedInsights.length,
            insightsBySection: Object.keys(newInsightsBySection).map(sectionId => ({
              sectionId,
              count: newInsightsBySection[sectionId].length
            }))
          });
          
          return {
            insightsBySection: newInsightsBySection,
            insights: orderedInsights.slice(0, 12),
            lastEmittedKeys: [...state.lastEmittedKeys, ...roiBrainInsights.map(i => i.key)]
          };
        });
        
        logEvent(get().logsEnabled, 'roi_brain_insights_populated', {
          count: roiBrainInsights.length,
          keys: roiBrainInsights.map(i => i.key),
          source: 'ROI_BRAIN'
        });
      },
      
      clearIqError: () => {
        set({ iqError: null, iqErrorBySection: {} });
      },
      
      setIqError: (sectionId, error) => {
        set((state) => ({
          iqError: error, // Keep legacy for backward compatibility
          iqErrorBySection: { ...state.iqErrorBySection, [sectionId]: error }
        }));
      },

      // Computed helpers
      getTotalQuestions: () => {
        const state = get();
        if (!state.config) return 0;
        return state.config.sections.reduce((total, section) => total + section.questions.length, 0);
      },

      getCurrentQuestionNumber: () => {
        const state = get();
        if (!state.config) return 0;
        
        let count = 0;
        for (let i = 0; i < state.currentSectionIndex; i++) {
          count += state.config.sections[i].questions.length;
        }
        count += state.currentQuestionIndex + 1;
        return count;
      },

      getProgressPercentage: () => {
        const state = get();
        const total = state.getTotalQuestions();
        const current = state.getCurrentQuestionNumber();
        return total > 0 ? Math.round((current / total) * 100) : 0;
      },

      isAtEnd: () => {
        const state = get();
        if (!state.config) return false;
        
        const lastSectionIndex = state.config.sections.length - 1;
        const lastSection = state.config.sections[lastSectionIndex];
        const lastQuestionIndex = lastSection ? lastSection.questions.length - 1 : -1;
        
        return state.currentSectionIndex === lastSectionIndex && 
               state.currentQuestionIndex === lastQuestionIndex;
      },

      canGoBack: () => {
        const state = get();
        return !(state.currentSectionIndex === 0 && state.currentQuestionIndex === 0);
      },

      isSectionComplete: (sectionIndex: number) => {
        const state = get();
        if (!state.config) return false;
        
        const section = state.config.sections[sectionIndex];
        if (!section) return false;
        
        // Check if all questions in the section have answers
        return section.questions.every(q => state.answers[q.id] !== undefined);
      }
    }),
    {
      name: 'needagent.audit.v1',
      partialize: (state) => ({
        currentSectionIndex: state.currentSectionIndex,
        currentQuestionIndex: state.currentQuestionIndex,
        answers: state.answers,
        vertical: state.vertical,
        logsEnabled: state.logsEnabled,
        scoreSummary: state.scoreSummary,
        insights: state.insights,
        lastEmittedKeys: state.lastEmittedKeys,
        iqError: state.iqError,
        insightsBySection: state.insightsBySection,
        iqErrorBySection: state.iqErrorBySection
      })
    }
  )
);