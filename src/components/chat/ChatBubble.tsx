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
        'flex w-full mb-6 animate-fade-in-scale group',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {!isUser && avatar && (
        <Avatar className="h-8 w-8 mr-4 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
          <AvatarImage src={avatar} alt="Bot avatar" />
          <AvatarFallback className="text-xs bg-gradient-glow text-primary-foreground font-medium">
            AI
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-4 transition-all duration-300',
          isUser
            ? 'bg-primary text-primary-foreground ml-4 shadow-[var(--shadow-medium)]'
            : 'bg-card text-card-foreground shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-medium)]',
          !isUser && !avatar && 'mr-4'
        )}
      >
        <p className="text-sm md:text-base leading-relaxed font-medium">{message}</p>
        {timestamp && (
          <p className="text-xs opacity-75 mt-2 font-light">{timestamp}</p>
        )}
      </div>
      {isUser && avatar && (
        <Avatar className="h-8 w-8 ml-4 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
          <AvatarImage src={avatar} alt="User avatar" />
          <AvatarFallback className="text-xs bg-secondary text-secondary-foreground font-medium">
            U
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}