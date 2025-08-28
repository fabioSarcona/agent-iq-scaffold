import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { NeedAgentIQInsight } from './types';

interface InsightPanelProps {
  insights: NeedAgentIQInsight[];
  className?: string;
}

export function InsightPanel({ insights, className }: InsightPanelProps) {
  if (insights.length === 0) {
    return null;
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-warning" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Insights</h3>
        <Badge variant="outline">{insights.length}</Badge>
      </div>
      
      {insights.map((insight) => (
        <Card key={insight.id} className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-base font-medium leading-tight">
                  {insight.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant={getPriorityColor(insight.priority) as any}
                    className="text-xs"
                  >
                    <span className="flex items-center gap-1">
                      {getPriorityIcon(insight.priority)}
                      {insight.priority}
                    </span>
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {insight.category}
                  </Badge>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {formatCurrency(insight.monthlyImpact.amount, insight.monthlyImpact.currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {insight.monthlyImpact.confidence}% confidence
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-3">
              {insight.description}
            </p>
            
            <div className="flex items-center justify-between text-xs">
              <div className="text-muted-foreground">
                Related to: <span className="font-medium">{insight.skill.name}</span>
              </div>
              {insight.actionable && (
                <Badge variant="secondary" className="text-xs">
                  Actionable
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}