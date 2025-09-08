import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { formatCurrency } from './utils'
import type { SimulationTotals } from './types'

interface CTAProps {
  totals: SimulationTotals
  onGetPlan: () => void
}

export function CTA({ totals, onGetPlan }: CTAProps) {
  // Show CTA only if conditions are met
  const shouldShowCTA = React.useMemo(() => {
    const hasActiveSkills = totals.activeSkillsCount > 0
    const highROI = totals.netROI > 500 // $500/mo threshold
    const highROIPercentage = totals.roiPercentage > 100 // 100% threshold
    
    return hasActiveSkills && (highROI || highROIPercentage)
  }, [totals])

  if (!shouldShowCTA) {
    return null
  }

  return (
    <div className="sticky bottom-4 z-50 mx-auto max-w-4xl">
      <Card className="glass-card backdrop-blur-md border-primary/20 shadow-2xl">
        <div className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Based on your selection, you could recover
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(totals.netROI)}/mo
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">Ready to get started?</p>
                <p className="text-sm font-semibold text-primary">
                  Get your custom implementation plan
                </p>
              </div>
              
              <Button 
                onClick={onGetPlan}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
              >
                <span className="hidden sm:inline">Get My Plan</span>
                <span className="sm:hidden">Get Plan</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="mt-3 flex items-center space-x-2">
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
                    i <= 1 ? 'bg-primary' : 'bg-secondary'
                  }`} 
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-2">
              Step 3: Get Your Custom Plan
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}