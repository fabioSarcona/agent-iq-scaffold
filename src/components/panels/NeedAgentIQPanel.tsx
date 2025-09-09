import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, Lightbulb, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuditProgressStore } from '@modules/audit/AuditProgressStore';
const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
const getImpactBadgeVariant = (impact: string) => {
  switch (impact) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'outline';
  }
};
interface InsightCardProps {
  insight: any; // TODO: Type this properly based on your insight type
}
function InsightCard({
  insight
}: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const truncateText = (text: string, maxLength: number = 60): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  return <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="border rounded-lg bg-card/50 hover:bg-card transition-colors duration-200">
      <CollapsibleTrigger asChild>
        <div className="w-full p-3 cursor-pointer hover:bg-muted/5 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-medium leading-tight text-foreground">
                  {truncateText(insight.title, 45)}
                </h4>
                <div className="flex items-center gap-1">
                  {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform" /> : <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform" />}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-medium">
                    {formatCurrency(insight.monthlyImpactUsd || 0)}/mo
                  </span>
                </div>
                <Badge variant={getImpactBadgeVariant(insight.impact)} className="text-xs">
                  {insight.impact}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="animate-accordion-down">
        <div className="px-3 pb-3 space-y-3 border-t border-border/30 pt-3 mt-1">
          {insight.description && <div>
              <h5 className="text-xs font-medium text-foreground mb-1">Description</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {insight.description}
              </p>
            </div>}
          
          {insight.rationale && insight.rationale.length > 0 && <div>
              <h5 className="text-xs font-medium text-foreground mb-1">Key Points</h5>
              <ul className="space-y-1">
                {insight.rationale.map((point: string, index: number) => <li key={index} className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1">
                    <span className="text-primary mt-1">•</span>
                    <span>{point}</span>
                  </li>)}
              </ul>
            </div>}
          
          {(insight.skill?.name || insight.category) && <div>
              <h5 className="text-xs font-medium text-foreground mb-1">Category</h5>
              <p className="text-xs text-muted-foreground">
                {insight.skill?.name || insight.category}
              </p>
            </div>}
          
          <div className="pt-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary-foreground px-3 w-full">
              View Full Analysis
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>;
}
export function NeedAgentIQPanel() {
  const {
    insights,
    iqError,
    clearIqError
  } = useAuditProgressStore();

  // Show error state if there's an error
  if (iqError) {
    return <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <CardTitle className="text-sm text-destructive">Insights Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-destructive/80">{iqError}</p>
          <Button variant="outline" size="sm" onClick={clearIqError} className="text-xs">
            Dismiss
          </Button>
        </CardContent>
      </Card>;
  }

  // Show placeholder if no insights yet
  if (insights.length === 0) {
    return <Card className="border-muted">
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
      </Card>;
  }

  // Render insights
  return <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-1">
          <Lightbulb className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">AI Insights</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {insights.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {insights.map(insight => <InsightCard key={insight.key || insight.title} insight={insight} />)}
      </CardContent>
    </Card>;
}