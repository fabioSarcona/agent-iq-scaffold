import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, Calculator, BarChart3 } from 'lucide-react'

import type { RevenueSimulatorProps } from './types'
import { useSimulator, useROICalculation } from './hooks'
import { formatCurrency, formatPercentage } from './utils'
import { CTA } from './CTA'
import { SaveForm } from './SaveForm'
import { ROIChart } from './Chart'

export function RevenueSimulator({ 
  insights, 
  moneyLost, 
  pricing, 
  vertical, 
  businessSize 
}: RevenueSimulatorProps) {
  const { skills, totals, toggleSkill, activateAll, deactivateAll } = useSimulator({
    insights,
    businessSize,
    vertical
  })

  const { roiColor, hasActiveSkills } = useROICalculation(totals)
  
  // Save form state
  const [isSaveFormOpen, setIsSaveFormOpen] = React.useState(false)

  // Show empty state if no insights
  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Revenue Simulator</span>
          </CardTitle>
          <CardDescription>
            No AI Voice Skills available for simulation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Complete your audit to see potential ROI from AI Voice Skills
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Totals */}
      <Card className="glass-card backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle>Revenue Simulator</CardTitle>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={deactivateAll}
                disabled={!hasActiveSkills}
              >
                Clear All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={activateAll}
              >
                Select All
              </Button>
            </div>
          </div>
          <CardDescription>
            Simulate ROI by activating AI Voice Skills for your {businessSize.toLowerCase()} {vertical} practice
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(totals.totalRecoverableRevenue)}
              </p>
              <p className="text-sm text-muted-foreground">Monthly Recovery</p>
            </div>
            
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(totals.totalCost)}
              </p>
              <p className="text-sm text-muted-foreground">Monthly Cost</p>
            </div>
            
            <div className="text-center space-y-1">
              <p className={`text-2xl font-bold ${roiColor}`}>
                {formatCurrency(totals.netROI)}
              </p>
              <p className="text-sm text-muted-foreground">Net ROI</p>
            </div>
            
            <div className="text-center space-y-1">
              <p className={`text-2xl font-bold ${roiColor}`}>
                {formatPercentage(totals.roiPercentage)}
              </p>
              <p className="text-sm text-muted-foreground">ROI %</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center mt-4 space-x-4">
            <Badge variant="secondary" className="px-3 py-1">
              {totals.activeSkillsCount}/{totals.totalSkillsCount} Skills Active
            </Badge>
            {hasActiveSkills && (
              <Badge 
                variant={totals.netROI > 0 ? "success" : "destructive"}
                className="px-3 py-1"
              >
                {totals.netROI > 0 ? "Profitable" : "Loss"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skills List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>AI Voice Skills</span>
        </h3>
        
        <div className="grid gap-4">
          {skills.map((skill) => (
            <Card 
              key={skill.id}
              className={`transition-all duration-200 ${
                skill.isActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={skill.isActive}
                        onCheckedChange={() => toggleSkill(skill.id)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {skill.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {skill.rationale}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Recovery Rate</p>
                        <p className="font-medium text-foreground">
                          {(skill.recoveryRate * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monthly Impact</p>
                        <p className="font-medium text-foreground">
                          {formatCurrency(skill.monthlyImpact)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monthly Cost</p>
                        <p className="font-medium text-foreground">
                          {formatCurrency(skill.cost)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ROI if Active</p>
                        <p className={`font-medium ${
                          skill.roiIfActive > 0 
                            ? 'text-success' 
                            : 'text-destructive'
                        }`}>
                          {formatCurrency(skill.roiIfActive)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex items-center">
                    <TrendingUp className={`h-5 w-5 ${
                      skill.roiIfActive > 0 
                        ? 'text-success' 
                        : 'text-muted-foreground'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ROI Chart */}
      <ROIChart skills={skills} />

      {/* Summary Note */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <DollarSign className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Revenue Impact:</strong> Based on conservative estimates from your audit data 
                and {vertical} industry benchmarks. Actual results may vary based on implementation 
                quality and market conditions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion CTA */}
      <CTA 
        totals={totals} 
        onGetPlan={() => setIsSaveFormOpen(true)} 
      />

      {/* Save Form Modal */}
      <SaveForm
        isOpen={isSaveFormOpen}
        onClose={() => setIsSaveFormOpen(false)}
        totals={totals}
        skills={skills}
        vertical={vertical}
        businessSize={businessSize}
      />
    </div>
  )
}