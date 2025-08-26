import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface ChatBubbleProps {
  message: string
  isUser: boolean
  timestamp?: string
  className?: string
  avatar?: string
}

export function ChatBubble({ message, isUser, timestamp, className, avatar }: ChatBubbleProps) {
  return (
    <div
      className={cn(
        'flex w-full mb-4 animate-slide-in',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {!isUser && avatar && (
        <Avatar className="h-6 w-6 mr-3 mt-1 flex-shrink-0">
          <AvatarImage src={avatar} alt="Bot avatar" />
          <AvatarFallback className="text-xs">F</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
          isUser
            ? 'bg-chat-bubble-user text-chat-bubble-user-text ml-4'
            : 'bg-chat-bubble-bot text-chat-bubble-bot-text',
          !isUser && !avatar && 'mr-4'
        )}
      >
        <p className="text-sm leading-relaxed">{message}</p>
        {timestamp && (
          <p className="text-xs opacity-70 mt-1">{timestamp}</p>
        )}
      </div>
      {isUser && avatar && (
        <Avatar className="h-6 w-6 ml-3 mt-1 flex-shrink-0">
          <AvatarImage src={avatar} alt="User avatar" />
          <AvatarFallback className="text-xs">U</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}