import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CheckCircle, ArrowRight } from "lucide-react"
import type { RecommendedPlan } from "../report.types"

interface PlanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  plan: RecommendedPlan
}

const PlanCard = React.forwardRef<HTMLDivElement, PlanCardProps>(
  ({ className, plan, ...props }, ref) => {
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0 
      }).format(price)
    }

    return (
      <Card 
        ref={ref} 
        className={cn(
          "border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl",
          className
        )} 
        {...props}
      >
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-foreground">{plan.name}</CardTitle>
          <div className="flex items-baseline justify-center space-x-1 mt-2">
            <span className="text-4xl font-bold text-primary">{formatPrice(plan.priceMonthlyUsd)}</span>
            <span className="text-muted-foreground font-medium">/month</span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Inclusions */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Included Features</h4>
              <ul className="space-y-3">
                {plan.inclusions.map((inclusion, index) => (
                  <li key={index} className="flex items-start space-x-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground leading-relaxed">{inclusion}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Add-ons */}
            {plan.addons && plan.addons.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-4">Available Add-ons</h4>
                <ul className="space-y-3">
                  {plan.addons.map((addon, index) => (
                    <li key={index} className="flex items-start space-x-3 text-sm">
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground leading-relaxed">{addon}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="text-center pt-6">
            <Button size="lg" className="bg-brand-gradient text-white hover:opacity-90 transition-opacity">
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
)

PlanCard.displayName = "PlanCard"

export { PlanCard }