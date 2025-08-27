import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuditProgressStore } from '@/stores/auditProgressStore'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { TypingDots } from '@/components/chat/TypingDots'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InputOTPEnhanced } from '@/components/ui/input-otp-enhanced'
import { calculateTypingDelay } from '@/lib/typingUtils'
import { REGISTRATION_FIELDS, type RegistrationField, type Phone } from '../types'
import { validateRegistrationField, formatE164Phone } from '../validation'
import { PhoneInput } from '@/components/registration/PhoneInput'
import { CountrySelector } from '@/components/registration/CountrySelector'
import { requestOtp, verifyOtp } from '../otp.client'

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
    otpCooldownUntil,
    updateRegistrationField,
    setRegistrationIndex,
    nextRegistrationStep,
    backRegistrationStep,
    setCurrentStep,
    setEmailVerified,
    setOtpCooldown
  } = useAuditProgressStore()

  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [currentInput, setCurrentInput] = useState('')
  const [validationError, setValidationError] = useState<string>('')
  const [otpCode, setOtpCode] = useState('')
  const [awaitingOtp, setAwaitingOtp] = useState(false)
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  const currentField = REGISTRATION_FIELDS[registrationIndex]
  const isLastField = registrationIndex === REGISTRATION_FIELDS.length - 1
  const isEmailField = currentField.key === 'email'

  // Handle OTP cooldown timer
  useEffect(() => {
    if (!otpCooldownUntil) return
    
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((otpCooldownUntil - Date.now()) / 1000))
      setCooldownSeconds(remaining)
      
      if (remaining === 0) {
        setOtpCooldown(0)
      }
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [otpCooldownUntil, setOtpCooldown])

  // Reset OTP state when leaving email field
  useEffect(() => {
    if (!isEmailField) {
      setAwaitingOtp(false)
      setOtpCode('')
      setValidationError('')
    }
  }, [isEmailField])

  // Get current field value from store (memoized to prevent re-renders)
  const getCurrentValue = useCallback(() => {
    const value = registrationData[currentField.key]
    if (currentField.key === 'phone') {
      return value as Phone
    }
    return value as string
  }, [registrationData, currentField.key])

  // Validate current field (memoized)
  const validateCurrentField = useCallback(() => {
    const value = getCurrentValue()
    const validation = validateRegistrationField(currentField.key, value)
    setValidationError(validation.error || '')
    return validation.success
  }, [getCurrentValue, currentField.key])

  // Show question with typing animation (removed getCurrentValue dependency)
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
    }, delay)
  }, [currentField, registrationIndex])

  // Pre-fill input with existing value (separate effect to avoid circular dependency)
  useEffect(() => {
    const existingValue = getCurrentValue()
    if (currentField.type === 'phone') {
      const phoneValue = existingValue as Phone
      setCurrentInput(phoneValue.national)
    } else {
      setCurrentInput(existingValue as string || '')
    }
  }, [getCurrentValue, currentField.type])

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

  // Handle OTP request
  const handleOtpRequest = async () => {
    if (isRequestingOtp || cooldownSeconds > 0) return
    
    setIsRequestingOtp(true)
    setValidationError('')
    
    try {
      const email = registrationData.email
      const response = await requestOtp(email)
      
      if (response.error) {
        setValidationError(response.error)
      } else {
        setAwaitingOtp(true)
        if (response.cooldownSeconds) {
          setOtpCooldown(Date.now() + response.cooldownSeconds * 1000)
        }
        
        // Show success message
        const successMessage: Message = {
          id: `otp-sent-${Date.now()}`,
          text: `Perfect! We've sent a 6-digit code to ${email}. Please enter it below.`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, successMessage])
      }
    } catch (error) {
      setValidationError('Failed to send verification code. Please try again.')
    } finally {
      setIsRequestingOtp(false)
    }
  }

  // Handle OTP verification
  const handleOtpVerify = async () => {
    if (isVerifyingOtp || otpCode.length !== 6) return
    
    setIsVerifyingOtp(true)
    setValidationError('')
    
    try {
      const email = registrationData.email
      const response = await verifyOtp(email, otpCode)
      
      if (response.verified) {
        setEmailVerified(true)
        setAwaitingOtp(false)
        
        // Add success message and proceed
        const userMessage: Message = {
          id: `otp-success-${Date.now()}`,
          text: otpCode,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, userMessage])
        
        const successMessage: Message = {
          id: `otp-verified-${Date.now()}`,
          text: 'Great! Your email is now verified. Let\'s continue.',
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, successMessage])
        
        // Move to next field
        setTimeout(() => {
          nextRegistrationStep()
        }, 1000)
      } else {
        setValidationError(response.error || 'Invalid verification code. Please try again.')
      }
    } catch (error) {
      setValidationError('Failed to verify code. Please try again.')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleNext = async () => {
    // Special handling for email field
    if (isEmailField) {
      if (!validateCurrentField()) return
      
      if (!registrationData.emailVerified) {
        await handleOtpRequest()
        return
      }
    } else {
      if (!validateCurrentField()) return
    }

    // Add user response to chat (skip for email if awaiting OTP)
    if (!isEmailField || registrationData.emailVerified) {
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
    }

    if (isLastField) {
      // Check email verification before completing registration
      if (!registrationData.emailVerified) {
        setValidationError('Please verify your email before continuing.')
        return
      }
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

    // Show OTP input if awaiting OTP verification
    if (isEmailField && awaitingOtp) {
      return (
        <div className="space-y-4">
          <InputOTPEnhanced
            value={otpCode}
            onChange={setOtpCode}
            onComplete={(code) => {
              setOtpCode(code)
              // Auto-verify when 6 digits are entered
              setTimeout(() => handleOtpVerify(), 100)
            }}
            disabled={isVerifyingOtp}
            length={6}
          />
          
          <div className="flex flex-col items-center space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOtpRequest}
              disabled={cooldownSeconds > 0 || isRequestingOtp}
              className="text-sm"
            >
              {cooldownSeconds > 0 
                ? `Resend code in ${cooldownSeconds}s`
                : isRequestingOtp 
                  ? 'Sending...'
                  : 'Resend code'
              }
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Didn't receive the code? Check your spam folder or try resending.
            </p>
          </div>
        </div>
      )
    }

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
          <div className="space-y-2">
            <Input
              type={currentField.type}
              value={currentInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={currentField.placeholder}
              className="w-full"
            />
            {isEmailField && !awaitingOtp && (
              <p className="text-xs text-muted-foreground">
                We'll send a 6-digit code to verify your address. No spam.
              </p>
            )}
          </div>
        )
    }
  }

  // Memoize validation result to prevent calling on every render
  const isValid = useMemo(() => {
    // For email field awaiting OTP, check if OTP is ready
    if (isEmailField && awaitingOtp) {
      return otpCode.length === 6 && !isVerifyingOtp
    }
    
    // For email field, check both email validation and verification status
    if (isEmailField) {
      const emailValid = validateRegistrationField(currentField.key, getCurrentValue()).success
      return emailValid && !isRequestingOtp
    }
    
    // For other fields, normal validation
    const value = getCurrentValue()
    return validateRegistrationField(currentField.key, value).success
  }, [getCurrentValue, currentField.key, isEmailField, awaitingOtp, otpCode, isVerifyingOtp, isRequestingOtp])

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
              {awaitingOtp ? 'Enter your 6-digit verification code' : currentField.question}
            </Label>
            <p className="text-sm text-muted-foreground">
              {awaitingOtp 
                ? `We sent a code to ${registrationData.email}. Enter it below to continue.`
                : currentField.helper
              }
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
              onClick={awaitingOtp ? handleOtpVerify : handleNext}
              disabled={!isValid}
            >
              {awaitingOtp 
                ? (isVerifyingOtp ? 'Verifying...' : 'Verify Code')
                : isEmailField && !registrationData.emailVerified
                  ? (isRequestingOtp ? 'Sending Code...' : 'Send Verification Code')
                  : isLastField 
                    ? 'Start the audit' 
                    : 'Next'
              }
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}