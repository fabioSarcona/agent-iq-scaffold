import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuditAnswer {
  questionId: string
  answer: string | number
  timestamp: Date
}

interface Phone {
  countryCode: string
  national: string
}

export interface RegistrationData {
  firstName: string
  lastName: string
  email: string
  phone: Phone
  businessName: string
  role: string
  city: string
  country: string
}

export interface Question {
  id: string
  text: string
  description: string
  type: 'number' | 'text' | 'multiple-choice'
  options?: string[]
  validation?: {
    min?: number
    max?: number
  }
}

export interface AuditProgressState {
  currentStep: string | number
  answers: AuditAnswer[]
  industry: 'dental' | 'hvac' | null
  registrationData: RegistrationData
  registrationIndex: number
  
  // Audit-specific state
  currentQuestionIndex: number
  auditQuestions: Question[]
  auditAnswers: Record<string, string | number>
  auditStarted: boolean
  auditCompleted: boolean
  
  // Actions
  setCurrentStep: (step: string | number) => void
  addAnswer: (answer: AuditAnswer) => void
  setIndustry: (industry: 'dental' | 'hvac') => void
  updateRegistrationField: (field: keyof RegistrationData, value: any) => void
  setRegistrationIndex: (index: number) => void
  nextRegistrationStep: () => void
  backRegistrationStep: () => void
  resetRegistration: () => void
  getRegistrationField: (field: keyof RegistrationData) => string | Phone | undefined
  clearRegistrationData: () => void
  resetProgress: () => void
  
  // Audit actions
  loadAuditQuestions: (industry: 'dental' | 'hvac') => Promise<void>
  setCurrentQuestionIndex: (index: number) => void
  addAuditAnswer: (questionId: string, answer: string | number) => void
  getAuditAnswer: (questionId: string) => string | number | undefined
  startAudit: () => void
  restartAudit: () => void
  completeAudit: () => void
}

export const useAuditProgressStore = create<AuditProgressState>()(
  persist(
    (set, get) => ({
      currentStep: 'welcome',
      answers: [],
      industry: null,
      registrationData: {
        firstName: '',
        lastName: '',
        email: '',
        phone: { countryCode: 'US', national: '' },
        businessName: '',
        role: '',
        city: '',
        country: 'US'
      },
      registrationIndex: 0,
      
      // Audit state
      currentQuestionIndex: 0,
      auditQuestions: [],
      auditAnswers: {},
      auditStarted: false,
      auditCompleted: false,

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

      setRegistrationIndex: (index) => set({ registrationIndex: index }),
      
      nextRegistrationStep: () => set((state) => ({
        registrationIndex: Math.min(state.registrationIndex + 1, 7)
      })),
      
      backRegistrationStep: () => set((state) => ({
        registrationIndex: Math.max(state.registrationIndex - 1, 0)
      })),
      
      resetRegistration: () => set({
        registrationIndex: 0,
        registrationData: {
          firstName: '',
          lastName: '',
          email: '',
          phone: { countryCode: 'US', national: '' },
          businessName: '',
          role: '',
          city: '',
          country: 'US'
        }
      }),

      getRegistrationField: (field) => get().registrationData[field],

      clearRegistrationData: () => set({ 
        registrationData: {
          firstName: '',
          lastName: '',
          email: '',
          phone: { countryCode: 'US', national: '' },
          businessName: '',
          role: '',
          city: '',
          country: 'US'
        }
      }),
      
      resetProgress: () => 
        set({
          currentStep: 'welcome',
          answers: [],
          industry: null,
          registrationData: {
            firstName: '',
            lastName: '',
            email: '',
            phone: { countryCode: 'US', national: '' },
            businessName: '',
            role: '',
            city: '',
            country: 'US'
          },
          registrationIndex: 0,
          currentQuestionIndex: 0,
          auditQuestions: [],
          auditAnswers: {},
          auditStarted: false,
          auditCompleted: false
        }),

      // Audit actions
      loadAuditQuestions: async (industry) => {
        try {
          const response = await fetch(`/modules/audit/audit-config.${industry}.json`)
          const data = await response.json()
          set({ 
            auditQuestions: data.questions,
            currentQuestionIndex: 0,
            auditStarted: true 
          })
        } catch (error) {
          console.error('Failed to load audit questions:', error)
        }
      },

      setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),

      addAuditAnswer: (questionId, answer) =>
        set((state) => ({
          auditAnswers: {
            ...state.auditAnswers,
            [questionId]: answer
          }
        })),

      getAuditAnswer: (questionId) => get().auditAnswers[questionId],

      startAudit: () => set({ auditStarted: true, currentQuestionIndex: 0 }),

      restartAudit: () => 
        set({ 
          currentQuestionIndex: 0, 
          auditAnswers: {}, 
          auditCompleted: false,
          auditStarted: true 
        }),

      completeAudit: () => set({ auditCompleted: true })
    }),
    {
      name: 'audit-progress-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
        answers: state.answers,
        industry: state.industry,
        registrationData: state.registrationData,
        registrationIndex: state.registrationIndex,
        currentQuestionIndex: state.currentQuestionIndex,
        auditAnswers: state.auditAnswers,
        auditStarted: state.auditStarted,
        auditCompleted: state.auditCompleted
      })
    }
  )
)