import { useState, useEffect } from 'react'
import { useAuditProgressStore } from '@/stores/auditProgressStore'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { TypingDots } from '@/components/chat/TypingDots'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { auditLogger } from '@/lib/auditLogger'
import { calculateTypingDelay } from '@/lib/typingUtils'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface Question {
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

interface AuditEngineProps {
  industry: 'dental' | 'hvac'
}

export function AuditEngine({ industry }: AuditEngineProps) {
  const { 
    currentQuestionIndex,
    auditQuestions,
    auditAnswers,
    loadAuditQuestions,
    setCurrentQuestionIndex,
    addAuditAnswer,
    getAuditAnswer,
    completeAudit
  } = useAuditProgressStore()

  const [messages, setMessages] = useState<Array<{text: string, isUser: boolean}>>([])
  const [isTyping, setIsTyping] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState<string | number>('')
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    loadAuditQuestions(industry)
  }, [industry, loadAuditQuestions])

  useEffect(() => {
    if (auditQuestions.length > 0 && currentQuestionIndex < auditQuestions.length) {
      showCurrentQuestion()
    }
  }, [auditQuestions, currentQuestionIndex])

  const showCurrentQuestion = () => {
    const question = auditQuestions[currentQuestionIndex]
    if (!question) return

    const existingAnswer = getAuditAnswer(question.id)
    if (existingAnswer !== undefined) {
      setCurrentAnswer(existingAnswer)
    } else {
      setCurrentAnswer('')
    }

    setIsTyping(true)
    
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { text: question.text, isUser: false },
        { text: question.description, isUser: false }
      ])
      setIsTyping(false)
      
      auditLogger.log({
        type: 'question_view',
        questionId: question.id,
        questionIndex: currentQuestionIndex,
        industry
      })
    }, calculateTypingDelay(question.text))
  }

  const validateAnswer = (answer: string | number, question: Question): string => {
    if (!answer && answer !== 0) {
      return 'Please provide an answer'
    }

    if (question.type === 'number') {
      const num = Number(answer)
      if (isNaN(num)) {
        return 'Please enter a valid number'
      }
      if (question.validation?.min !== undefined && num < question.validation.min) {
        return `Value must be at least ${question.validation.min}`
      }
      if (question.validation?.max !== undefined && num > question.validation.max) {
        return `Value must be no more than ${question.validation.max}`
      }
    }

    if (question.type === 'text' && typeof answer === 'string' && answer.trim().length < 2) {
      return 'Please provide a more detailed answer'
    }

    return ''
  }

  const handleSubmitAnswer = () => {
    const question = auditQuestions[currentQuestionIndex]
    const error = validateAnswer(currentAnswer, question)
    
    if (error) {
      setValidationError(error)
      auditLogger.log({
        type: 'validation_error',
        questionId: question.id,
        questionIndex: currentQuestionIndex,
        error,
        industry
      })
      return
    }

    setValidationError('')
    
    // Add user's answer to chat
    setMessages(prev => [...prev, { text: String(currentAnswer), isUser: true }])
    
    // Save answer
    addAuditAnswer(question.id, currentAnswer)
    
    auditLogger.log({
      type: 'answer_submit',
      questionId: question.id,
      questionIndex: currentQuestionIndex,
      answer: currentAnswer,
      industry
    })

    // Move to next question or complete
    if (currentQuestionIndex < auditQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setCurrentAnswer('')
        auditLogger.log({
          type: 'step_transition',
          questionIndex: currentQuestionIndex + 1,
          industry
        })
      }, 500)
    } else {
      // Audit completed
      setTimeout(() => {
        completeAudit()
        setMessages(prev => [...prev, { 
          text: "Perfect! Your audit is complete. Let's see how much you could be saving...", 
          isUser: false 
        }])
      }, 500)
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setValidationError('')
      auditLogger.log({
        type: 'back_click',
        questionIndex: currentQuestionIndex - 1,
        industry
      })
    }
  }

  const renderQuestionInput = (question: Question) => {
    if (question.type === 'multiple-choice') {
      return (
        <div className="space-y-2 mt-4">
          {question.options?.map((option, index) => (
            <Button
              key={index}
              variant={currentAnswer === option ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setCurrentAnswer(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      )
    }

    if (question.type === 'number') {
      return (
        <Input
          type="number"
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(Number(e.target.value))}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
          className="mt-4"
          placeholder="Enter a number..."
          min={question.validation?.min}
          max={question.validation?.max}
        />
      )
    }

    return (
      <Textarea
        value={currentAnswer}
        onChange={(e) => setCurrentAnswer(e.target.value)}
        className="mt-4"
        placeholder="Type your answer here..."
        rows={3}
      />
    )
  }

  if (auditQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <TypingDots />
      </div>
    )
  }

  const currentQuestion = auditQuestions[currentQuestionIndex]
  const isAuditComplete = currentQuestionIndex >= auditQuestions.length

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {messages.map((message, index) => (
          <ChatBubble
            key={index}
            message={message.text}
            isUser={message.isUser}
          />
        ))}
        {isTyping && <TypingDots />}
      </div>

      {!isAuditComplete && currentQuestion && (
        <Card>
          <CardContent className="p-6">
            {renderQuestionInput(currentQuestion)}
            
            {validationError && (
              <p className="text-destructive text-sm mt-2">{validationError}</p>
            )}

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <Button onClick={handleSubmitAnswer}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isAuditComplete && (
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Audit Complete!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for completing the audit. Now let's see how much you could be saving.
            </p>
            <Button asChild size="lg">
              <a href="/moneylost">See how much you're losing</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}