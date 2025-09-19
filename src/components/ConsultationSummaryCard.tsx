import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Target, Lightbulb, AlertTriangle, CheckCircle } from "lucide-react";
import type { VoiceFitReportData } from "@modules/ai/voicefit";
import type { MoneyLostSummary } from "../../modules/moneylost/types";
import { formatCurrency } from "../../modules/moneylost/components/LossAreaCard";

interface ConsultationSummaryCardProps {
  reportData: VoiceFitReportData;
  moneyLost: MoneyLostSummary;
}

export function ConsultationSummaryCard({ reportData, moneyLost }: ConsultationSummaryCardProps) {
  // Get score color based on band
  const getScoreBadgeVariant = (band: string) => {
    switch (band?.toLowerCase()) {
      case 'crisis': return 'destructive';
      case 'optimization': return 'secondary';
      case 'growth': return 'default';
      case 'ai-optimized': return 'default';
      default: return 'secondary';
    }
  };

  const getScoreBadgeColor = (band: string) => {
    switch (band?.toLowerCase()) {
      case 'crisis': return 'text-destructive';
      case 'optimization': return 'text-warning';
      case 'growth': return 'text-accent';
      case 'ai-optimized': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  // Extract top pain points from diagnosis (first 2-3 items)
  const topPainPoints = reportData.diagnosis?.slice(0, 3) || [];

  // Get top solutions with highest estimated recovery
  const topSolutions = reportData.solutions
    ?.filter(sol => {
      const recoveryPct = Array.isArray(sol.estimatedRecoveryPct) 
        ? sol.estimatedRecoveryPct[0] 
        : sol.estimatedRecoveryPct;
      return recoveryPct && recoveryPct > 0;
    })
    ?.sort((a, b) => {
      const aRecovery = Array.isArray(a.estimatedRecoveryPct) 
        ? a.estimatedRecoveryPct[0] 
        : a.estimatedRecoveryPct || 0;
      const bRecovery = Array.isArray(b.estimatedRecoveryPct) 
        ? b.estimatedRecoveryPct[0] 
        : b.estimatedRecoveryPct || 0;
      return bRecovery - aRecovery;
    })
    ?.slice(0, 3) || [];

  return (
    <Card className="bg-gradient-to-br from-card to-muted/20 border border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Lightbulb className="h-5 w-5 text-accent" />
          Consultation Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Key Metrics */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Key Metrics
            </div>
            
            {/* AI Readiness Score */}
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Readiness Score</span>
              </div>
              <Badge 
                variant={getScoreBadgeVariant(reportData.band as string)}
                className={getScoreBadgeColor(reportData.band as string)}
              >
                {reportData.score}/100
              </Badge>
            </div>

            {/* Monthly Loss */}
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Est. Monthly Loss</span>
              </div>
              <span className="text-lg font-bold text-destructive">
                {formatCurrency(moneyLost.monthlyUsd)}
              </span>
            </div>

            {/* Solutions Count */}
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Solutions Identified</span>
              </div>
              <Badge variant="outline">
                {reportData.solutions?.length || 0}
              </Badge>
            </div>
          </div>

          {/* Right Column - Insights */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Key Insights
            </div>

            {/* Top Pain Points */}
            {topPainPoints.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Critical Pain Points
                </div>
                <div className="space-y-1">
                  {topPainPoints.map((point, index) => (
                    <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-2 h-2 bg-warning/60 rounded-full mt-2 flex-shrink-0" />
                      <span className="line-clamp-2">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Solutions */}
            {topSolutions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Priority Solutions
                </div>
                <div className="space-y-1">
                  {topSolutions.map((solution, index) => {
                    const recoveryPct = Array.isArray(solution.estimatedRecoveryPct) 
                      ? solution.estimatedRecoveryPct[0] 
                      : solution.estimatedRecoveryPct || 0;
                    return (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate flex-1 mr-2">
                          {solution.title}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {recoveryPct}% ROI
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended Plan */}
            {reportData.plan && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-primary">Recommended Plan</div>
                    <div className="text-lg font-bold text-foreground">{reportData.plan.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(reportData.plan.priceMonthlyUsd)}
                    </div>
                    <div className="text-xs text-muted-foreground">per month</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}