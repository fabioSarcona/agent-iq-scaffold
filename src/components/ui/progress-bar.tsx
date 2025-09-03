import { cn } from '@/lib/utils'

interface ProgressBarProps {
  progress: number
  className?: string
  showPercentage?: boolean
}

export function ProgressBar({ progress, className, showPercentage = true }: ProgressBarProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-foreground">Progress</span>
        {showPercentage && (
          <span className="text-sm text-muted-foreground font-medium bg-secondary/50 px-3 py-1 rounded-full backdrop-blur-sm">
            {progress}%
          </span>
        )}
      </div>
      <div className="relative w-full bg-secondary/50 rounded-full h-3 backdrop-blur-sm border border-border/50 overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-glow rounded-full transition-all duration-700 ease-out animate-shimmer"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>
    </div>
  )
}