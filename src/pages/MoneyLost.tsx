import { Button } from '@/components/ui/button'
import { useAuditProgressStore } from '../../modules/audit/AuditProgressStore'
import { MoneyLostSummaryCard, LossAreaCard, DisclaimerNote } from '../../modules/moneylost/components'
import { requestMoneyLost } from '../../modules/moneylost/client'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

export default function MoneyLost() {
  const navigate = useNavigate()
  const { vertical, answers } = useAuditProgressStore()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['moneylost', vertical, answers],
    queryFn: () => requestMoneyLost({ vertical, answers })
  });

  if (isLoading) return <div className="p-6">Calculating conservative estimates…</div>;
  if (error || !data) return <div className="p-6 text-destructive">Unable to compute MoneyLost.</div>;

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
        dailyUsd={data.dailyTotalUsd}
        monthlyUsd={data.monthlyTotalUsd}
        annualUsd={data.annualTotalUsd}
      />

      {/* Disclaimer */}
      <DisclaimerNote />

      {/* Assumptions */}
      {data.assumptions && data.assumptions.length > 0 && (
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Assumptions Applied</h3>
          <ul className="space-y-1">
            {data.assumptions.map((assumption, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {assumption}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Critical Areas */}
      {data.areas.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Critical Areas Identified</h2>
            <p className="text-muted-foreground mt-2">
              Key areas where your business is losing revenue
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.areas.map((area) => (
              <LossAreaCard 
                key={area.key}
                title={area.title}
                dailyUsd={area.dailyUsd}
                monthlyUsd={area.monthlyUsd}
                annualUsd={area.annualUsd}
                recoverablePctRange={area.recoverablePctRange}
                severity={area.severity}
                rationale={area.rationale}
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
          Version: {data.version} • Calculations use conservative industry benchmarks
        </p>
      </div>
    </div>
  )
}