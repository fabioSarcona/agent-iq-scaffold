import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Lightbulb, DollarSign } from 'lucide-react';
import { useAuditProgressStore } from '@modules/audit/AuditProgressStore';

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getImpactBadgeVariant = (impact: string) => {
  switch (impact) {
    case 'critical': return 'destructive';
    case 'high': return 'default';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'outline';
  }
};

export function NeedAgentIQPanel() {
  const { insights, iqError, clearIqError } = useAuditProgressStore();

  // Show error state if there's an error
  if (iqError) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <CardTitle className="text-sm text-destructive">Insights Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-destructive/80">{iqError}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearIqError}
            className="text-xs"
          >
            Dismiss
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show placeholder if no insights yet
  if (insights.length === 0) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm text-muted-foreground">AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Insights will appear as you complete sections.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render insights
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">AI Insights</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {insights.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => (
          <div 
            key={insight.key || insight.title}
            className="border rounded-lg p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 flex-1 min-w-0">
                <h4 className="text-xs font-medium leading-tight truncate">
                  {insight.title}
                </h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  <span>
                    {formatCurrency(insight.monthlyImpactUsd || 0)}/mo
                  </span>
                </div>
                {insight.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {insight.description}
                  </p>
                )}
              </div>
              <Badge 
                variant={getImpactBadgeVariant(insight.impact)}
                className="text-xs"
              >
                {insight.impact}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {insight.skill?.name || insight.category}
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-primary hover:text-primary-foreground px-2"
              >
                View details
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}