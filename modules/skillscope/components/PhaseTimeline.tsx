import { Clock, CheckCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface Phase {
  id: string;
  title: string;
  weeks?: number;
  steps: string[];
}

interface PhaseTimelineProps {
  phases: Phase[];
}

export function PhaseTimeline({ phases }: PhaseTimelineProps) {
  const { t } = useTranslation('report');

  if (!phases || phases.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {phases.map((phase, index) => (
        <div key={phase.id} className="relative">
          {/* Phase Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border-2 border-primary">
              <span className="text-sm font-semibold text-primary">{index + 1}</span>
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-foreground">{phase.title}</h4>
              {phase.weeks && (
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {t('skillscope.phase_timeline', { number: index + 1, weeks: phase.weeks })}
                  </span>
                </div>
              )}
            </div>
            
            {phase.weeks && (
              <Badge variant="outline" className="text-xs">
                {phase.weeks}w
              </Badge>
            )}
          </div>

          {/* Phase Steps */}
          <div className="ml-11 space-y-2">
            {phase.steps.map((step, stepIndex) => (
              <div key={stepIndex} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>

          {/* Connector Line */}
          {index < phases.length - 1 && (
            <div className="absolute left-4 top-12 w-px h-8 bg-border" />
          )}
        </div>
      ))}
    </div>
  );
}