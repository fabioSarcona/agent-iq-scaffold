import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bot, Phone, Calendar, Shield, Users, Settings, Info } from "lucide-react"
import { SkillScopeModal } from "./SkillScopeModal"

interface SolutionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  skillId: string;
  title: string;
  rationale: string;
  estimatedRecoveryPct?: [number, number];
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
  // Legacy prop for backward compatibility
  solution?: any;
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
  ({ className, skillId, title, rationale, estimatedRecoveryPct, auditContext, kb, solution, ...props }, ref) => {
    const [isSkillScopeOpen, setIsSkillScopeOpen] = React.useState(false);
    
    // Support both old and new prop patterns
    const actualSkillId = skillId || solution?.skillId || '';
    const actualTitle = title || solution?.title || '';
    const actualRationale = rationale || solution?.rationale || '';
    const actualRecoveryPct = estimatedRecoveryPct || solution?.estimatedRecoveryPct;
    
    const IconComponent = iconMap[actualTitle as keyof typeof iconMap] || iconMap.default;

    // Create skill data for SkillScope
    const skillData = React.useMemo(() => {
      // Try to find the skill in KB first, or create a minimal version
      const kbSkill = kb?.services.find(s => s.name === actualSkillId || s.name === actualTitle);
      
      return {
        id: actualSkillId,
        name: actualTitle,
        target: (auditContext?.auditType === "dental" ? "Dental" : "HVAC") as "Dental" | "HVAC",
        problem: kbSkill?.problem || actualRationale,
        how: kbSkill?.how || "AI-powered automation solution",
        roiRangeMonthly: kbSkill?.roiRangeMonthly,
        tags: kbSkill?.tags || [actualSkillId.toLowerCase().replace(/\s+/g, '-')],
      };
    }, [actualSkillId, actualTitle, actualRationale, auditContext?.auditType, kb]);

    const handleLearnMore = () => {
      setIsSkillScopeOpen(true);
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
                  Estimated recovery: {actualRecoveryPct[0]}–{actualRecoveryPct[1]}%
                </p>
              </div>
            )}
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLearnMore}
                className="w-full"
                disabled={!auditContext}
              >
                <Info className="h-4 w-4 mr-2" />
                Learn More
              </Button>
            </div>
          </CardContent>
        </Card>

        {auditContext && (
          <SkillScopeModal
            isOpen={isSkillScopeOpen}
            onClose={() => setIsSkillScopeOpen(false)}
            skillData={skillData}
            context={auditContext}
            kb={kb}
          />
        )}
      </>
    );
  }
)

SolutionCard.displayName = "SolutionCard"

export { SolutionCard }
export type { SolutionCardProps }