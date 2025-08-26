import { useState, useEffect } from 'react'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { TypingDots } from '@/components/chat/TypingDots'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Button } from '@/components/ui/button'
import { calculateTypingDelay } from '@/lib/typingUtils'
import { ArrowRight } from 'lucide-react'

const WELCOME_MESSAGES = {
  dental: [
    "Hi 👋, I'm Fabio Sarcona, founder of NeedAgent AI. For over 10 years, I've been helping dental practices win back patients and save time through smart automation.",
    "Today, I'll guide you through a quick audit to uncover how a Voice AI Agent could help streamline your practice.",
    "But before we dive in, I'd love to get to know you a little better — just a few seconds, I promise. 😊"
  ],
  hvac: [
    "Hi 👋, I'm Fabio Sarcona, founder of NeedAgent AI. For over 10 years, I've been helping HVAC companies win back clients and save time through smart automation.",
    "Today, I'll guide you through a quick audit to uncover how a Voice AI Agent could help streamline your practice.",
    "But before we dive in, I'd love to get to know you a little better — just a few seconds, I promise. 😊"
  ]
}

const INDUSTRY_CONFIG = {
  dental: {
    title: "Dental Practice Audit",
    description: "Let's analyze your practice and identify growth opportunities"
  },
  hvac: {
    title: "HVAC Business Audit", 
    description: "Optimize your HVAC operations for maximum efficiency and growth"
  }
}

interface WelcomeProps {
  industry: 'dental' | 'hvac'
  onComplete: () => void
}

export function Welcome({ industry, onComplete }: WelcomeProps) {
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; id: string }>>([])
  const [isTyping, setIsTyping] = useState(false)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  const welcomeMessages = WELCOME_MESSAGES[industry]
  const config = INDUSTRY_CONFIG[industry]

  useEffect(() => {
    if (currentMessageIndex < welcomeMessages.length) {
      const timer = setTimeout(() => {
        setIsTyping(true)
        
        const currentMessage = welcomeMessages[currentMessageIndex]
        const typingDuration = calculateTypingDelay(currentMessage)
        
        setTimeout(() => {
          setMessages(prev => [...prev, {
            text: currentMessage,
            isUser: false,
            id: `bot-${currentMessageIndex}`
          }])
          setIsTyping(false)
          setCurrentMessageIndex(prev => prev + 1)
        }, typingDuration)
      }, currentMessageIndex === 0 ? 500 : 2000)

      return () => clearTimeout(timer)
    }
  }, [currentMessageIndex, welcomeMessages])

  const progress = (currentMessageIndex / welcomeMessages.length) * 100

  return (
    <div className="max-w-[800px] mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{config.title}</h1>
        <p className="text-muted-foreground">
          {config.description}
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
              avatar={!message.isUser ? "/placeholder.svg" : undefined}
            />
          ))}
          
          {isTyping && <TypingDots />}
        </div>

        {!isTyping && currentMessageIndex >= welcomeMessages.length && (
          <div className="flex justify-center mt-6">
            <Button onClick={onComplete} className="bg-brand-gradient hover:opacity-90">
              Let's get started!
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}