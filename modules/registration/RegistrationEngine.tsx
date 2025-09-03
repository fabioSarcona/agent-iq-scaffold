import { lazy, Suspense } from 'react'
import { useAuditProgressStore } from '@modules/audit/AuditProgressStore'
import { TypingDots } from '@/components/chat/TypingDots'
import { Welcome } from './steps/Welcome'
import { Registration } from './steps/Registration'

const AuditEngine = lazy(() => import('@modules/audit/AuditEngine').then(module => ({ default: module.AuditEngine })))

interface RegistrationEngineProps {
  industry: 'dental' | 'hvac'
}

export function RegistrationEngine({ industry }: RegistrationEngineProps) {
  const { currentStep, setCurrentStep } = useAuditProgressStore()

  const handleWelcomeComplete = () => {
    setCurrentStep('registration:firstName')
  }

  // Show registration step if currentStep starts with 'registration:'
  if (typeof currentStep === 'string' && currentStep.startsWith('registration:')) {
    return <Registration />
  }

  // If audit should start, show audit engine
  if (currentStep === 'audit:firstQuestion') {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-64"><TypingDots /></div>}>
        <AuditEngine industry={industry} />
      </Suspense>
    )
  }

  // Default to welcome step
  return <Welcome industry={industry} onComplete={handleWelcomeComplete} />
}