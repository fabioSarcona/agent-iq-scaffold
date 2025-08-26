import { Button } from '@/components/ui/button'
import { useAuditProgressStore } from '@/../modules/audit/AuditProgressStore'
import { buildMockMoneyLost } from '@/../modules/moneylost/moneylost.mock'
import { MoneyLostSummaryCard } from '@/../modules/moneylost/components/MoneyLostSummaryCard'
import { LossAreaCard } from '@/../modules/moneylost/components/LossAreaCard'
import { DisclaimerNote } from '@/../modules/moneylost/components/DisclaimerNote'
import { useNavigate } from 'react-router-dom'

export default function MoneyLost() {
  const navigate = useNavigate()
  const { vertical, answers } = useAuditProgressStore()
  
  // Use mock calculations based on vertical and audit answers
  const mockSummary = buildMockMoneyLost(vertical, answers)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Money Lost — Conservative Estimate</h1>
        <p className="text-lg text-muted-foreground">
          Based on your audit responses, here's your potential revenue impact
        </p>
      </div>

      {/* Summary Card */}
      <MoneyLostSummaryCard 
        dailyUsd={mockSummary.dailyUsd}
        monthlyUsd={mockSummary.monthlyUsd}
        annualUsd={mockSummary.annualUsd}
      />

      {/* Disclaimer */}
      <DisclaimerNote />

      {/* Critical Areas */}
      {mockSummary.areas.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Critical Areas Identified</h2>
            <p className="text-muted-foreground mt-2">
              Key areas where your business is losing revenue
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockSummary.areas.map((area) => (
              <LossAreaCard 
                key={area.id}
                title={area.title}
                dailyUsd={area.dailyUsd}
                monthlyUsd={area.monthlyUsd}
                annualUsd={area.annualUsd}
                recoverablePctRange={area.recoverablePctRange}
                confidence={area.confidence}
                notes={area.notes}
              />
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="text-center pt-8">
        <Button 
          size="lg" 
          onClick={() => navigate('/report')}
          className="text-lg px-8 py-6 w-full md:w-auto"
        >
          View your personalized report
        </Button>
      </div>
    </div>
  )
}