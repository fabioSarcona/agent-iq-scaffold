import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bot, Phone, Calendar, Shield, Users, Settings, Info } from "lucide-react"
import { useTranslation } from '@/hooks/useTranslation'

interface SolutionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  skillId: string;
  title: string;
  rationale: string;
  estimatedRecoveryPct?: [number, number];
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
  ({ className, skillId, title, rationale, estimatedRecoveryPct, onLearnMore, auditContext, kb, solution, ...props }, ref) => {
    
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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <IconComponent className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {actualTitle}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {actualRationale}
            </p>
            {actualRecoveryPct && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs font-medium text-primary">
                  {t('solution.estimated_recovery')}: {actualRecoveryPct[0]}–{actualRecoveryPct[1]}%
                </p>
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