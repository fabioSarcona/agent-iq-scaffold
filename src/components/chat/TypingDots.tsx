import { cn } from '@/lib/utils'

interface TypingDotsProps {
  className?: string
}

export function TypingDots({ className }: TypingDotsProps) {
  return (
    <div className={cn('flex justify-start mb-6', className)}>
      <div className="bg-card rounded-2xl px-5 py-4 mr-4 shadow-[var(--shadow-subtle)] transition-all duration-300">
        <div className="flex space-x-2 items-center">
          <div className="flex space-x-1">
            <div
              className="w-2.5 h-2.5 bg-primary rounded-full animate-typing opacity-60"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2.5 h-2.5 bg-primary rounded-full animate-typing opacity-80"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-2.5 h-2.5 bg-primary rounded-full animate-typing opacity-60"
              style={{ animationDelay: '300ms' }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium ml-2">AI is thinking...</span>
        </div>
      </div>
    </div>
  )
}