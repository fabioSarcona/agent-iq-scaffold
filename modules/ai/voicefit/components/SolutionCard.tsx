import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bot, Phone, Calendar, Shield, Users, Settings, Info, DollarSign } from "lucide-react"
import { useTranslation } from '@/hooks/useTranslation'

interface SolutionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  skillId: string;
  title: string;
  rationale: string;
  estimatedRecoveryPct?: [number, number];
  monthlyImpact?: number;
  priority?: 'high' | 'medium' | 'low';
  onLearnMore?: () => void;
  // Legacy props for backward compatibility
  auditContext?: {
    auditId: string;
    auditType: "dental" | "hvac";
    business?: {
      name?: string;
      location?: string;
      size?: { chairs?: number; techs?: number };
    };
    settings?: {
      currency?: "USD" | "EUR";
      locale?: "en-US" | "it-IT";
    };
  };
  kb?: {
    approved_claims: string[];
    services: Array<{
      name: string;
      target: "Dental" | "HVAC" | "Both";
      problem: string;
      how: string;
      roiRangeMonthly?: [number, number];
      tags?: string[];
    }>;
  };
  solution?: {
    skillId?: string;
    title?: string;
    rationale?: string;
    estimatedRecoveryPct?: [number, number];
  };
}

const iconMap = {
  "24/7 AI Receptionist": Phone,
  "Automated Appointment Reminders": Calendar,
  "Treatment Plan Follow-up Agent": Users,
  "24/7 Service Call Agent": Phone,
  "Smart Scheduling Assistant": Calendar,
  "Quote Follow-up Agent": Settings,
  "Overflow Management Agent": Shield,
  default: Bot
}

const SolutionCard = React.forwardRef<HTMLDivElement, SolutionCardProps>(
  ({ className, skillId, title, rationale, estimatedRecoveryPct, monthlyImpact, priority, onLearnMore, auditContext, kb, solution, ...props }, ref) => {
    
    // Support both old and new prop patterns
    const actualSkillId = skillId || solution?.skillId || '';
    const actualTitle = title || solution?.title || '';
    const actualRationale = rationale || solution?.rationale || '';
    const actualRecoveryPct = estimatedRecoveryPct || solution?.estimatedRecoveryPct;
    const { t } = useTranslation('report');
    
    const IconComponent = iconMap[actualTitle as keyof typeof iconMap] || iconMap.default;

    const handleLearnMore = () => {
      if (onLearnMore) {
        onLearnMore();
      }
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0 
      }).format(amount);
    };

    const getPriorityColor = (priority?: string) => {
      switch (priority) {
        case 'high': return 'bg-red-100 text-red-800 border-red-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'low': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-muted text-muted-foreground border-border';
      }
    };

    return (
      <>
        <Card 
          ref={ref} 
          className={cn(
            "rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border-border/50",
            className
          )} 
          {...props}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <IconComponent className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  {actualTitle}
                </CardTitle>
              </div>
              {priority && (
                <div className={cn(
                  "px-2 py-1 rounded-md text-xs font-medium border",
                  getPriorityColor(priority)
                )}>
                  {t(`solution.priority_${priority}`)}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {actualRationale}
            </p>
            {(actualRecoveryPct || monthlyImpact) && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-xs">
                  {actualRecoveryPct && (
                    <p className="font-medium text-primary">
                      {t('solution.estimated_recovery')}: {actualRecoveryPct[0]}–{actualRecoveryPct[1]}%
                    </p>
                  )}
                  {monthlyImpact && (
                    <div className="flex items-center space-x-1 font-medium text-green-600">
                      <DollarSign className="h-3 w-3" />
                      <span>{formatCurrency(monthlyImpact)}</span>
                      <span className="text-muted-foreground">/{t('plan.per_month').replace('/', '')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {onLearnMore && (
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLearnMore}
                  className="w-full"
                >
                  <Info className="h-4 w-4 mr-2" />
                  {t('solution.learn_more')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </>
    );
  }
)

SolutionCard.displayName = "SolutionCard"

export { SolutionCard }
export type { SolutionCardProps }