import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuditConfig, AuditSection, Question } from './types';

interface AuditProgressState {
  // Current position
  currentSectionIndex: number;
  currentQuestionIndex: number;
  
  // Data
  answers: Record<string, unknown>;
  logsEnabled: boolean;
  vertical: 'dental' | 'hvac';
  
  // Config
  config: AuditConfig | null;
  currentSection: AuditSection | null;
  currentQuestion: Question | null;
  
  // Actions
  setVertical: (vertical: 'dental' | 'hvac') => void;
  loadConfig: (config: AuditConfig) => void;
  setAnswer: (questionId: string, value: unknown) => void;
  next: () => void;
  back: () => void;
  restart: () => void;
  toggleLogs: () => void;
  
  // Computed helpers
  getTotalQuestions: () => number;
  getCurrentQuestionNumber: () => number;
  getProgressPercentage: () => number;
  isAtEnd: () => boolean;
  canGoBack: () => boolean;
}

const logEvent = (logsEnabled: boolean, event: string, data?: any) => {
  if (logsEnabled) {
    console.log(`[AUDIT LOG] ${event}:`, data || '');
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
        set((state) => ({
          answers: { ...state.answers, [questionId]: value }
        }));
        
        logEvent(state.logsEnabled, 'answer_submit', { questionId, value });
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
          currentSection: firstSection || null,
          currentQuestion: firstQuestion || null
        });

        logEvent(state.logsEnabled, 'restart');
        
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
        console.log(`Audit logging ${newState.logsEnabled ? 'enabled' : 'disabled'}`);
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
      }
    }),
    {
      name: 'needagent.audit.v1',
      partialize: (state) => ({
        currentSectionIndex: state.currentSectionIndex,
        currentQuestionIndex: state.currentQuestionIndex,
        answers: state.answers,
        vertical: state.vertical,
        logsEnabled: state.logsEnabled
      })
    }
  )
);