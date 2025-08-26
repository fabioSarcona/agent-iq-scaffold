import { useState, useEffect } from 'react'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { TypingDots } from '@/components/chat/TypingDots'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CountrySelector } from './CountrySelector'
import { PhoneInput } from './PhoneInput'
import { useAuditProgressStore } from '@/stores/auditProgressStore'
import { validateRegistrationField } from '@/lib/validationSchemas'
import { calculateTypingDelay } from '@/lib/typingUtils'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RegistrationField {
  key: 'firstName' | 'lastName' | 'email' | 'phone' | 'businessName' | 'role' | 'city' | 'country'
  step: string
  question: string
  helper: string
  placeholder: string
  type: 'text' | 'email' | 'phone' | 'country'
}

const REGISTRATION_FIELDS: RegistrationField[] = [
  {
    key: 'firstName',
    step: 'registration:firstName',
    question: "What's your first name?",
    helper: "We'll use this to personalize your experience",
    placeholder: "Enter your first name",
    type: 'text'
  },
  {
    key: 'lastName',
    step: 'registration:lastName',
    question: "And your last name?",
    helper: "Just so we know how to address you properly",
    placeholder: "Enter your last name",
    type: 'text'
  },
  {
    key: 'email',
    step: 'registration:email',
    question: "What's your email address?",
    helper: "We'll send your audit results here",
    placeholder: "Enter your email",
    type: 'email'
  },
  {
    key: 'phone',
    step: 'registration:phone',
    question: "What's your phone number?",
    helper: "Include country code for best results",
    placeholder: "Enter phone number",
    type: 'phone'
  },
  {
    key: 'businessName',
    step: 'registration:businessName',
    question: "What's your clinic/business name?",
    helper: "The name patients know you by",
    placeholder: "Enter business name",
    type: 'text'
  },
  {
    key: 'role',
    step: 'registration:role',
    question: "What's your role there?",
    helper: "Owner, Manager, Staff, etc.",
    placeholder: "Enter your role",
    type: 'text'
  },
  {
    key: 'city',
    step: 'registration:city',
    question: "Which city are you located in?",
    helper: "This helps us provide location-specific insights",
    placeholder: "Enter your city",
    type: 'text'
  },
  {
    key: 'country',
    step: 'registration:country',
    question: "And which country?",
    helper: "We'll customize recommendations for your market",
    placeholder: "Select your country",
    type: 'country'
  }
]

export function RegistrationStep() {
  const { currentStep, setCurrentStep, updateRegistrationField, getRegistrationField } = useAuditProgressStore()
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; id: string }>>([])
  const [isTyping, setIsTyping] = useState(false)
  const [fieldValue, setFieldValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [hasShownQuestion, setHasShownQuestion] = useState(false)

  const currentField = REGISTRATION_FIELDS.find(field => field.step === currentStep)
  const currentFieldIndex = REGISTRATION_FIELDS.findIndex(field => field.step === currentStep)
  
  useEffect(() => {
    if (currentField && !hasShownQuestion) {
      // Load existing value if any
      const existingValue = getRegistrationField(currentField.key)
      if (existingValue) {
        setFieldValue(existingValue)
      }

      // Show question with typing animation
      setIsTyping(true)
      setError(null)
      
      const typingDuration = calculateTypingDelay(currentField.question)
      
      const timer = setTimeout(() => {
        setMessages(prev => [...prev, {
          text: currentField.question,
          isUser: false,
          id: `bot-${currentField.key}`
        }])
        setIsTyping(false)
        setHasShownQuestion(true)
      }, typingDuration)

      return () => clearTimeout(timer)
    }
  }, [currentField, hasShownQuestion, getRegistrationField])

  const handleInputChange = (value: string) => {
    setFieldValue(value)
    setError(null)
  }

  const validateAndProceed = () => {
    if (!currentField) return

    const validation = validateRegistrationField(currentField.key, fieldValue)
    
    if (!validation.success) {
      setError(validation.error)
      return
    }

    // Save the field value
    updateRegistrationField(currentField.key, fieldValue)
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      text: fieldValue,
      isUser: true,
      id: `user-${currentField.key}`
    }])

    // Move to next step or complete registration
    const nextIndex = currentFieldIndex + 1
    if (nextIndex < REGISTRATION_FIELDS.length) {
      setCurrentStep(REGISTRATION_FIELDS[nextIndex].step)
      setFieldValue('')
      setHasShownQuestion(false)
    } else {
      // Registration complete - move to next phase
      setCurrentStep('registration:complete')
    }
  }

  const handleBack = () => {
    if (currentFieldIndex > 0) {
      const prevField = REGISTRATION_FIELDS[currentFieldIndex - 1]
      setCurrentStep(prevField.step)
      setHasShownQuestion(false)
      
      // Remove the last two messages (user answer and bot question)
      setMessages(prev => prev.slice(0, -2))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && fieldValue.trim()) {
      validateAndProceed()
    }
  }

  if (!currentField) {
    return null
  }

  const renderInput = () => {
    const inputProps = {
      value: fieldValue,
      placeholder: currentField.placeholder,
      className: cn(
        "w-full",
        error && "border-destructive focus-visible:ring-destructive"
      ),
      onKeyPress: handleKeyPress
    }

    switch (currentField.type) {
      case 'email':
        return (
          <Input
            {...inputProps}
            type="email"
            onChange={(e) => handleInputChange(e.target.value)}
          />
        )
      case 'phone':
        return (
          <PhoneInput
            {...inputProps}
            onChange={handleInputChange}
          />
        )
      case 'country':
        return (
          <CountrySelector
            {...inputProps}
            onValueChange={handleInputChange}
          />
        )
      default:
        return (
          <Input
            {...inputProps}
            type="text"
            onChange={(e) => handleInputChange(e.target.value)}
          />
        )
    }
  }

  return (
    <div className="max-w-[800px] mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Registration</h1>
        <p className="text-muted-foreground">
          Step {currentFieldIndex + 1} of {REGISTRATION_FIELDS.length}
        </p>
      </div>

      <div className="bg-card rounded-lg p-6 min-h-[400px] border shadow-sm">
        <div className="space-y-4 mb-6">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              timestamp={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              avatar={!message.isUser ? "/placeholder.svg" : undefined}
            />
          ))}
          
          {isTyping && <TypingDots />}
        </div>

        {!isTyping && hasShownQuestion && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field-input" className="text-sm text-muted-foreground">
                {currentField.helper}
              </Label>
              {renderInput()}
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentFieldIndex === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              
              <Button
                onClick={validateAndProceed}
                disabled={!fieldValue.trim()}
                className="bg-brand-gradient hover:opacity-90 flex items-center gap-2"
              >
                {currentFieldIndex === REGISTRATION_FIELDS.length - 1 ? 'Complete' : 'Next'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}