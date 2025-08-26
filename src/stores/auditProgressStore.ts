import { create } from 'zustand'

export interface AuditAnswer {
  questionId: string
  answer: string
  timestamp: Date
}

export interface AuditProgressState {
  currentStep: number
  answers: AuditAnswer[]
  industry: 'dental' | 'hvac' | null
  
  // Actions
  setCurrentStep: (step: number) => void
  addAnswer: (answer: AuditAnswer) => void
  setIndustry: (industry: 'dental' | 'hvac') => void
  resetProgress: () => void
}

export const useAuditProgressStore = create<AuditProgressState>((set) => ({
  currentStep: 0,
  answers: [],
  industry: null,

  setCurrentStep: (step) => set({ currentStep: step }),
  
  addAnswer: (answer) => 
    set((state) => ({
      answers: [...state.answers, answer]
    })),
  
  setIndustry: (industry) => set({ industry }),
  
  resetProgress: () => 
    set({
      currentStep: 0,
      answers: [],
      industry: null
    }),
}))