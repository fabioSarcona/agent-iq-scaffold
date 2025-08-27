import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Bot, Phone, Calendar, Shield, Users, Settings } from "lucide-react"
import type { RecommendedSolution } from "../report.types"

interface SolutionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  solution: RecommendedSolution
}

const iconMap = {
  "24/7 AI Receptionist": Phone,
  "Automated Appointment Reminders": Calendar,
  "Treatment Plan Follow-up Agent": Users,
  "24/7 Service Call Agent": Phone,
  "Smart Scheduling Assistant": Calendar,
  "Quote Follow-up Agent": Settings,
  "Overflow Management Agent": Shield,
  default: Bot
}

const SolutionCard = React.forwardRef<HTMLDivElement, SolutionCardProps>(
  ({ className, solution, ...props }, ref) => {
    const IconComponent = iconMap[solution.title as keyof typeof iconMap] || iconMap.default

    return (
      <Card 
        ref={ref} 
        className={cn(
          "rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border-border/50",
          className
        )} 
        {...props}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold text-foreground">
              {solution.title}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {solution.rationale}
          </p>
          {solution.estimatedRecoveryPct && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs font-medium text-primary">
                Estimated recovery: {solution.estimatedRecoveryPct[0]}–{solution.estimatedRecoveryPct[1]}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)

SolutionCard.displayName = "SolutionCard"

export { SolutionCard }