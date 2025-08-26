import { useState, useEffect, useCallback } from 'react'
import { useAuditProgressStore } from '@/stores/auditProgressStore'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { TypingDots } from '@/components/chat/TypingDots'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calculateTypingDelay } from '@/lib/typingUtils'
import { REGISTRATION_FIELDS, type RegistrationField, type Phone } from '../types'
import { validateRegistrationField, formatE164Phone } from '../validation'
import { PhoneInput } from '@/components/registration/PhoneInput'
import { CountrySelector } from '@/components/registration/CountrySelector'

interface Message {
  id: string
  text: string
  sender: 'bot' | 'user'
  timestamp: string
}

export function Registration() {
  const { 
    registrationData, 
    registrationIndex, 
    updateRegistrationField,
    setRegistrationIndex,
    nextRegistrationStep,
    backRegistrationStep,
    setCurrentStep
  } = useAuditProgressStore()

  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [currentInput, setCurrentInput] = useState('')
  const [validationError, setValidationError] = useState<string>('')

  const currentField = REGISTRATION_FIELDS[registrationIndex]
  const isLastField = registrationIndex === REGISTRATION_FIELDS.length - 1

  // Get current field value from store
  const getCurrentValue = useCallback(() => {
    const value = registrationData[currentField.key]
    if (currentField.key === 'phone') {
      return value as Phone
    }
    return value as string
  }, [registrationData, currentField.key])

  // Validate current field
  const validateCurrentField = useCallback(() => {
    const value = getCurrentValue()
    const validation = validateRegistrationField(currentField.key, value)
    setValidationError(validation.error || '')
    return validation.success
  }, [getCurrentValue, currentField.key])

  // Show question with typing animation
  const showQuestion = useCallback(async () => {
    setIsTyping(true)
    const delay = calculateTypingDelay(currentField.question)
    
    setTimeout(() => {
      setIsTyping(false)
      const questionMessage: Message = {
        id: `question-${registrationIndex}`,
        text: currentField.question,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, questionMessage])
      
      // Pre-fill input with existing value
      const existingValue = getCurrentValue()
      if (currentField.type === 'phone') {
        const phoneValue = existingValue as Phone
        setCurrentInput(phoneValue.national)
      } else {
        setCurrentInput(existingValue as string || '')
      }
    }, delay)
  }, [currentField, registrationIndex, getCurrentValue])

  // Load question on mount or index change
  useEffect(() => {
    showQuestion()
  }, [showQuestion])

  // Handle input change
  const handleInputChange = (value: string | Phone) => {
    if (currentField.type === 'phone') {
      const phoneValue = value as Phone
      setCurrentInput(phoneValue.national)
      updateRegistrationField(currentField.key, phoneValue)
    } else {
      const stringValue = value as string
      setCurrentInput(stringValue)
      updateRegistrationField(currentField.key, stringValue)
    }
    
    // Clear validation error on input change
    if (validationError) {
      setValidationError('')
    }
  }

  // Handle next step
  const handleNext = () => {
    if (!validateCurrentField()) {
      return
    }

    // Add user response to chat
    const currentValue = getCurrentValue()
    let displayValue = ''
    
    if (currentField.type === 'phone') {
      const phone = currentValue as Phone
      displayValue = formatE164Phone(phone.countryCode, phone.national)
    } else {
      displayValue = currentValue as string
    }

    const userMessage: Message = {
      id: `answer-${registrationIndex}`,
      text: displayValue,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, userMessage])

    if (isLastField) {
      // Registration complete - transition to audit
      setCurrentStep('audit:firstQuestion')
    } else {
      // Move to next field
      nextRegistrationStep()
    }
  }

  // Handle back step
  const handleBack = () => {
    if (registrationIndex > 0) {
      backRegistrationStep()
    }
  }

  // Render input component based on field type
  const renderInput = () => {
    const value = getCurrentValue()

    switch (currentField.type) {
      case 'phone':
        return (
          <PhoneInput
            value={formatE164Phone((value as Phone).countryCode, (value as Phone).national)}
            onChange={handleInputChange}
            placeholder={currentField.placeholder}
            className="w-full"
          />
        )
      
      case 'select':
        return (
          <Select 
            value={value as string} 
            onValueChange={(selectedValue) => handleInputChange(selectedValue)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={currentField.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {currentField.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'country':
        return (
          <CountrySelector
            value={value as string}
            onValueChange={(selectedValue) => handleInputChange(selectedValue)}
            placeholder={currentField.placeholder}
            className="w-full"
          />
        )
      
      default:
        return (
          <Input
            type={currentField.type}
            value={currentInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={currentField.placeholder}
            className="w-full"
          />
        )
    }
  }

  const isValid = validateCurrentField()

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message.text}
            isUser={message.sender === 'user'}
            timestamp={message.timestamp}
          />
        ))}
        {isTyping && <TypingDots />}
      </div>

      {/* Input Section */}
      {!isTyping && (
        <div className="border-t border-border p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="registration-input" className="text-sm font-medium">
              {currentField.question}
            </Label>
            <p className="text-sm text-muted-foreground">
              {currentField.helper}
            </p>
            {renderInput()}
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={registrationIndex === 0}
            >
              Back
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!isValid}
            >
              {isLastField ? 'Start the audit' : 'Next'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}