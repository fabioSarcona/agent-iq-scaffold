import { lazy, Suspense } from 'react'
import { useAuditProgressStore } from '@/stores/auditProgressStore'
import { RegistrationStep } from '@/components/registration/RegistrationStep'
import { TypingDots } from '@/components/chat/TypingDots'
import { Welcome } from './steps/Welcome'

const AuditEngine = lazy(() => import('@/components/audit/AuditEngine').then(module => ({ default: module.AuditEngine })))

interface RegistrationEngineProps {
  industry: 'dental' | 'hvac'
}

export function RegistrationEngine({ industry }: RegistrationEngineProps) {
  const { currentStep, setCurrentStep } = useAuditProgressStore()

  const handleWelcomeComplete = () => {
    setCurrentStep('registration:firstName')
  }

  // Show registration step if currentStep starts with 'registration:' but is not 'registration:complete'
  if (typeof currentStep === 'string' && currentStep.startsWith('registration:') && currentStep !== 'registration:complete') {
    return <RegistrationStep />
  }

  // If registration is complete, show audit engine
  if (currentStep === 'registration:complete') {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-64"><TypingDots /></div>}>
        <AuditEngine industry={industry} />
      </Suspense>
    )
  }

  // Default to welcome step
  return <Welcome industry={industry} onComplete={handleWelcomeComplete} />
}