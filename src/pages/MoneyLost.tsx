import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LossAreaCard } from '@/components/ui/loss-area-card'
import { useAuditProgressStore } from '@/stores/auditProgressStore'
import { calculateMockLosses, formatCurrency } from '@/lib/mockCalculations'
import { DollarSign, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function MoneyLost() {
  const navigate = useNavigate()
  const { industry } = useAuditProgressStore()
  
  // Use mock calculations based on industry
  const currentIndustry = industry as 'dental' | 'hvac' || 'dental'
  const { total, areas } = calculateMockLosses(currentIndustry)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Revenue Loss Analysis</h1>
        <p className="text-lg text-muted-foreground">
          Based on your audit responses, here's your potential revenue impact
        </p>
      </div>

      {/* Summary Card */}
      <Card className="bg-brand-gradient text-white border-0">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Total Estimated Revenue Loss</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-white/80 text-sm font-medium">Daily</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(total.daily)}</p>
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Monthly</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(total.monthly)}</p>
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Annually</p>
              <p className="text-4xl font-bold text-white">{formatCurrency(total.annual)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Conservative Estimates
              </p>
              <p className="text-sm text-amber-700 mt-1">
                These are conservative estimates based on your audit responses. The actual impact could be significantly higher.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Areas */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Critical Areas Identified</h2>
          <p className="text-muted-foreground mt-2">
            Key areas where your business is losing revenue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {areas.map((area, index) => (
            <LossAreaCard key={index} lossArea={area} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-8">
        <Button 
          size="lg" 
          onClick={() => navigate('/report')}
          className="text-lg px-8 py-6"
        >
          View Your Personalized Report
        </Button>
      </div>
    </div>
  )
}