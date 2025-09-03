import { cn } from '@/lib/utils'

interface TypingDotsProps {
  className?: string
}

export function TypingDots({ className }: TypingDotsProps) {
  return (
    <div className={cn('flex justify-start mb-6', className)}>
      <div className="glass-card rounded-2xl px-5 py-4 mr-4 backdrop-blur-md hover-lift">
        <div className="flex space-x-2 items-center">
          <div className="flex space-x-1">
            <div
              className="w-2.5 h-2.5 bg-gradient-to-r from-brand-secondary to-brand-tertiary rounded-full animate-typing"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2.5 h-2.5 bg-gradient-to-r from-brand-secondary to-brand-tertiary rounded-full animate-typing"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-2.5 h-2.5 bg-gradient-to-r from-brand-secondary to-brand-tertiary rounded-full animate-typing"
              style={{ animationDelay: '300ms' }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium ml-2">AI is thinking...</span>
        </div>
      </div>
    </div>
  )
}