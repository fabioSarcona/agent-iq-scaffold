import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatCurrency, type LossArea } from "@/lib/mockCalculations"

interface LossAreaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  lossArea: LossArea
}

const LossAreaCard = React.forwardRef<HTMLDivElement, LossAreaCardProps>(
  ({ className, lossArea, ...props }, ref) => (
    <Card ref={ref} className={cn("", className)} {...props}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{lossArea.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{lossArea.subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Daily Loss:</span>
          <span className="text-sm font-semibold text-destructive">
            {formatCurrency(lossArea.losses.daily)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Monthly Loss:</span>
          <span className="text-sm font-semibold text-destructive">
            {formatCurrency(lossArea.losses.monthly)}
          </span>
        </div>
        <div className="flex justify-between items-center border-t pt-2">
          <span className="text-sm font-medium">Annual Loss:</span>
          <span className="text-base font-bold text-destructive">
            {formatCurrency(lossArea.losses.annual)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
)

LossAreaCard.displayName = "LossAreaCard"

export { LossAreaCard }