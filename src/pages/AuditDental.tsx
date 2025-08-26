import { useState, useEffect } from 'react'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { TypingDots } from '@/components/chat/TypingDots'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Button } from '@/components/ui/button'
import { useAuditProgressStore } from '@/stores/auditProgressStore'

const PLACEHOLDER_MESSAGES = [
  "Welcome to your dental practice audit! I'm here to help you identify opportunities for growth and optimization.",
  "Let's start by understanding your practice better. Can you tell me about your current patient volume and main services?",
  "Based on your responses, I'll analyze key areas like patient retention, marketing effectiveness, and operational efficiency."
]

export default function AuditDental() {
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; id: string }>>([])
  const [isTyping, setIsTyping] = useState(false)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const { setIndustry, currentStep } = useAuditProgressStore()

  useEffect(() => {
    setIndustry('dental')
  }, [setIndustry])

  useEffect(() => {
    if (currentMessageIndex < PLACEHOLDER_MESSAGES.length) {
      const timer = setTimeout(() => {
        setIsTyping(true)
        
        setTimeout(() => {
          setMessages(prev => [...prev, {
            text: PLACEHOLDER_MESSAGES[currentMessageIndex],
            isUser: false,
            id: `bot-${currentMessageIndex}`
          }])
          setIsTyping(false)
          setCurrentMessageIndex(prev => prev + 1)
        }, 1500) // Typing duration
      }, currentMessageIndex === 0 ? 500 : 2000) // Delay between messages

      return () => clearTimeout(timer)
    }
  }, [currentMessageIndex])

  const handleNext = () => {
    // Placeholder user response
    setMessages(prev => [...prev, {
      text: "I understand. Let me provide more details about my practice.",
      isUser: true,
      id: `user-${Date.now()}`
    }])
  }

  const progress = (currentMessageIndex / PLACEHOLDER_MESSAGES.length) * 100

  return (
    <div className="max-w-[800px] mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Dental Practice Audit</h1>
        <p className="text-muted-foreground">
          Let's analyze your practice and identify growth opportunities
        </p>
      </div>

      <ProgressBar progress={progress} />

      <div className="bg-card rounded-lg p-6 min-h-[400px] border shadow-sm">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              timestamp={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            />
          ))}
          
          {isTyping && <TypingDots />}
        </div>

        {!isTyping && currentMessageIndex >= 2 && (
          <div className="flex justify-center mt-6">
            <Button onClick={handleNext} className="bg-brand-gradient hover:opacity-90">
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}