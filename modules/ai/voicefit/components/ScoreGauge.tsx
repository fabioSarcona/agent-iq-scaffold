import * as React from "react"
import { cn } from "@/lib/utils"

interface ScoreGaugeProps {
  score: number
  className?: string
}

const ScoreGauge = React.forwardRef<HTMLDivElement, ScoreGaugeProps>(
  ({ score, className }, ref) => {
    const radius = 90
    const strokeWidth = 12
    const normalizedRadius = radius - strokeWidth * 2
    const circumference = normalizedRadius * 2 * Math.PI
    const strokeDasharray = `${circumference} ${circumference}`
    const strokeDashoffset = circumference - (score / 100) * circumference

    // Determine band and color based on score
    const getBand = (score: number) => {
      if (score <= 25) return { band: 'Crisis', color: 'hsl(var(--destructive))' }
      if (score <= 50) return { band: 'Optimization Needed', color: 'hsl(45, 93%, 47%)' }
      if (score <= 75) return { band: 'Growth Ready', color: 'hsl(225, 64%, 47%)' }
      return { band: 'AI-Optimized', color: 'hsl(120, 60%, 50%)' }
    }

    const { band, color } = getBand(score)

    return (
      <div ref={ref} className={cn("flex flex-col items-center space-y-4", className)}>
        <div className="relative">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              stroke="hsl(var(--muted))"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Progress circle */}
            <circle
              stroke={color}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          {/* Score text centered */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground">{score}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
        </div>
        {/* Band label */}
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">{band}</div>
          <div className="text-sm text-muted-foreground">Business Readiness</div>
        </div>
      </div>
    )
  }
)

ScoreGauge.displayName = "ScoreGauge"

export { ScoreGauge }