import { cn } from '@/lib/utils'

interface TypingDotsProps {
  className?: string
}

export function TypingDots({ className }: TypingDotsProps) {
  return (
    <div className={cn('flex justify-start mb-4', className)}>
      <div className="bg-chat-bubble-bot rounded-2xl px-4 py-3 mr-4">
        <div className="flex space-x-1">
          <div
            className="w-2 h-2 bg-muted-foreground rounded-full animate-typing"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="w-2 h-2 bg-muted-foreground rounded-full animate-typing"
            style={{ animationDelay: '150ms' }}
          />
          <div
            className="w-2 h-2 bg-muted-foreground rounded-full animate-typing"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  )
}