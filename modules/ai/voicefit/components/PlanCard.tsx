import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CheckCircle, ArrowRight } from "lucide-react"
import type { RecommendedPlan } from "../report.types"
import { useTranslation } from '@/hooks/useTranslation'

interface PlanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  priceMonthlyUsd: number;
  inclusions: string[];
  addons?: string[];
}

const PlanCard = React.forwardRef<HTMLDivElement, PlanCardProps>(
  ({ className, name, priceMonthlyUsd, inclusions, addons, ...props }, ref) => {
    const { t } = useTranslation('report');
    
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
          <CardTitle className="text-2xl font-bold text-foreground">{name}</CardTitle>
          <div className="flex items-baseline justify-center space-x-1 mt-2">
            <span className="text-4xl font-bold text-primary">{formatPrice(priceMonthlyUsd)}</span>
            <span className="text-muted-foreground font-medium">{t('plan.per_month')}</span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* ROI Summary - New enhancement for Phase 5.2 */}
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 border border-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{t('plan.expected_break_even')}</p>
                <p className="text-xs text-muted-foreground">{t('plan.based_on_recommended')}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{t('plan.months_range')}</p>
                <p className="text-xs text-green-600">{t('plan.typical_roi')}</p>
              </div>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Inclusions */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">{t('plan.included_features')}</h4>
              <ul className="space-y-3">
                {inclusions.map((inclusion, index) => (
                  <li key={index} className="flex items-start space-x-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground leading-relaxed">{inclusion}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Add-ons */}
            {addons && addons.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-4">{t('plan.available_addons')}</h4>
                <ul className="space-y-3">
                  {addons.map((addon, index) => (
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
              {t('plan.get_started')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
)

PlanCard.displayName = "PlanCard"

export { PlanCard }