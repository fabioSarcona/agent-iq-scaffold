import * as React from "react"
import { cn } from "@/lib/utils"

interface BusinessScoreGaugeProps extends React.HTMLAttributes<HTMLDivElement> {
  score: number
  label: string
  color: string
  size?: number
}

export function BusinessScoreGauge({ 
  score, 
  label, 
  color, 
  size = 200, 
  className, 
  ...props 
}: BusinessScoreGaugeProps) {
  const radius = (size - 40) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)} {...props}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--muted))"
            strokeWidth="20"
            fill="transparent"
          />
          
          {/* Score bands */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="20"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-foreground">{score}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
      </div>
      
      {/* Score label */}
      <div className="text-center space-y-1">
        <h3 className="text-xl font-semibold text-foreground">{label}</h3>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full bg-destructive opacity-60"></div>
            <span className="text-xs">0-25</span>
          </div>
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(32, 95%, 44%)' }}></div>
            <span className="text-xs">26-50</span>
          </div>
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(45, 93%, 47%)' }}></div>
            <span className="text-xs">51-75</span>
          </div>
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(120, 60%, 50%)' }}></div>
            <span className="text-xs">76-100</span>
          </div>
        </div>
      </div>
    </div>
  )
}