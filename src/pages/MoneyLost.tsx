import { Button } from '@/components/ui/button'
import { useAuditProgressStore } from '@modules/audit/AuditProgressStore'
import { MoneyLostSummaryCard, LossAreaCard, DisclaimerNote } from '@modules/moneylost/components'
import { requestMoneyLost } from '@modules/moneylost/client'
import { MoneyLostSummary } from '@/lib/validation'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

export default function MoneyLost() {
  const navigate = useNavigate()
  const { vertical, answers } = useAuditProgressStore()
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['moneylost', vertical, answers],
    queryFn: () => requestMoneyLost(vertical || 'dental', answers),
    retry: false,
  });

  let validatedData: ReturnType<typeof MoneyLostSummary.parse> | null = null;
  if (data) {
    try {
      validatedData = MoneyLostSummary.parse(data);
    } catch {
      // Validation failed - treat as error
    }
  }

  if (isLoading) return <div className="p-6">Calculating conservative estimates…</div>;
  
  if (error || !validatedData) {
    return (
      <div className="p-6 space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
          <p className="text-destructive font-medium">Unable to compute MoneyLost.</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

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
        dailyUsd={validatedData.total.dailyUsd}
        monthlyUsd={validatedData.total.monthlyUsd}
        annualUsd={validatedData.total.annualUsd}
      />

      {/* Disclaimer */}
      <DisclaimerNote />

      {/* Assumptions */}
      {validatedData.assumptions && validatedData.assumptions.length > 0 && (
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Assumptions Applied</h3>
          <ul className="space-y-1">
            {validatedData.assumptions.map((assumption, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {assumption}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Critical Areas */}
      {validatedData.areas.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Critical Areas Identified</h2>
            <p className="text-muted-foreground mt-2">
              Key areas where your business is losing revenue
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {validatedData.areas.map((area, index) => (
              <LossAreaCard 
                key={`${area.key}-${index}`}
                title={area.title}
                dailyUsd={area.dailyUsd}
                monthlyUsd={area.monthlyUsd}
                annualUsd={area.annualUsd}
                recoverablePct={[area.recoverablePctRange.min || 0, area.recoverablePctRange.max || 0]}
                severity="low"
                rationale={area.rationale.join(' ')}
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
        <p className="text-xs text-muted-foreground mt-2">
          Version: {validatedData.version} • Calculations use conservative industry benchmarks
        </p>
      </div>
    </div>
  )
}