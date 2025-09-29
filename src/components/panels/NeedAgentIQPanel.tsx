import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, Lightbulb, DollarSign, ChevronDown, ChevronRight, History, Clock } from 'lucide-react';
import { useAuditProgressStore } from '@modules/audit/AuditProgressStore';
import { featureFlags } from '@/env';
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
      return 'destructive';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
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
                {insight.monthlyImpactUsd && insight.monthlyImpactUsd > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    <span className="font-medium">
                      {formatCurrency(insight.monthlyImpactUsd)}/mo
                    </span>
                  </div>
                )}
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
    insightsBySection,
    iqError,
    clearIqError,
    config,
    currentSectionIndex
  } = useAuditProgressStore();

  const [showHistorical, setShowHistorical] = useState(false);

  // Get current section ID
  const currentSectionId = config?.sections[currentSectionIndex]?.id;

  // Get recent insights from current section only
  const recentInsights = currentSectionId 
    ? (insightsBySection[currentSectionId] ?? [])
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    : [];

  // Get historical insights from previous sections with insights > 0
  const previousSectionIds = Object
    .keys(insightsBySection || {})
    .filter(id => id !== currentSectionId && (insightsBySection[id]?.length ?? 0) > 0);

  const historicalInsights = previousSectionIds
    .flatMap(id => 
      (insightsBySection[id] ?? []).map(insight => ({
        ...insight,
        sectionId: id,
        sectionName: config?.sections.find(s => s.id === id)?.headline || id
      }))
    )
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

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
  if (recentInsights.length === 0 && historicalInsights.length === 0) {
    const isROIBrainActive = featureFlags.shouldUseRoiBrain();
    
    return <Card className="border-muted">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm text-muted-foreground">AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {isROIBrainActive 
              ? "Live insights upon completion of the report" 
              : "Insights will appear as you complete sections."
            }
          </p>
        </CardContent>
      </Card>;
  }

  // Calculate badge count based on actually rendered insights
  const totalRendered = recentInsights.length + (historicalInsights.length > 0 ? historicalInsights.length : 0);
  
  // Show historical when there are insights from previous sections
  const shouldShowHistorical = historicalInsights.length > 0;

  // Render insights
  return <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-1">
          <Lightbulb className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">AI Insights</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {totalRendered}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-2 space-y-3">
        {/* Recent Insights */}
        {recentInsights.map((insight, index) => (
          <div key={insight.key || insight.title} className="relative">
            <InsightCard insight={insight} />
            <Badge 
              variant="success" 
              className="absolute -top-1 -right-1 text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
            >
              New
            </Badge>
          </div>
        ))}

        {/* Previous Sections Accordion */}
        {shouldShowHistorical && (
          <Collapsible open={showHistorical} onOpenChange={setShowHistorical}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between text-xs text-muted-foreground hover:text-foreground h-8"
              >
                <div className="flex items-center gap-2">
                  <History className="h-3 w-3" />
                  <span>Previous Insights</span>
                  <Badge variant="outline" className="text-xs">
                    {historicalInsights.length}
                  </Badge>
                </div>
                {showHistorical ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-2 mt-2">
              {/* Historical insights from previous sections */}
              {historicalInsights.map((insight) => (
                <div key={`${insight.sectionId}-${insight.key}`} className="opacity-75 hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <InsightCard insight={insight} />
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className="text-xs opacity-70">
                        <Clock className="h-2 w-2 mr-1" />
                        {insight.sectionName}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>;
}