import { create } from 'zustand'

export interface AuditAnswer {
  questionId: string
  answer: string
  timestamp: Date
}

export interface RegistrationData {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  businessName?: string
  role?: string
  city?: string
  country?: string
}

export interface AuditProgressState {
  currentStep: string | number
  answers: AuditAnswer[]
  industry: 'dental' | 'hvac' | null
  registrationData: RegistrationData
  
  // Actions
  setCurrentStep: (step: string | number) => void
  addAnswer: (answer: AuditAnswer) => void
  setIndustry: (industry: 'dental' | 'hvac') => void
  updateRegistrationField: (field: keyof RegistrationData, value: string) => void
  getRegistrationField: (field: keyof RegistrationData) => string | undefined
  clearRegistrationData: () => void
  resetProgress: () => void
}

export const useAuditProgressStore = create<AuditProgressState>((set, get) => ({
  currentStep: 'welcome',
  answers: [],
  industry: null,
  registrationData: {},

  setCurrentStep: (step) => set({ currentStep: step }),
  
  addAnswer: (answer) => 
    set((state) => ({
      answers: [...state.answers, answer]
    })),
  
  setIndustry: (industry) => set({ industry }),

  updateRegistrationField: (field, value) =>
    set((state) => ({
      registrationData: {
        ...state.registrationData,
        [field]: value
      }
    })),

  getRegistrationField: (field) => get().registrationData[field],

  clearRegistrationData: () => set({ registrationData: {} }),
  
  resetProgress: () => 
    set({
      currentStep: 'welcome',
      answers: [],
      industry: null,
      registrationData: {}
    }),
}))