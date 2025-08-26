import { cn } from '@/lib/utils'

interface ChatBubbleProps {
  message: string
  isUser: boolean
  timestamp?: string
  className?: string
}

export function ChatBubble({ message, isUser, timestamp, className }: ChatBubbleProps) {
  return (
    <div
      className={cn(
        'flex w-full mb-4 animate-slide-in',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
          isUser
            ? 'bg-chat-bubble-user text-chat-bubble-user-text ml-4'
            : 'bg-chat-bubble-bot text-chat-bubble-bot-text mr-4'
        )}
      >
        <p className="text-sm leading-relaxed">{message}</p>
        {timestamp && (
          <p className="text-xs opacity-70 mt-1">{timestamp}</p>
        )}
      </div>
    </div>
  )
}