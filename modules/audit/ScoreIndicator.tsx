import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

interface ScoreIndicatorProps {
  sectionTitle: string;
  questionsAnswered: number;
  totalQuestions: number;
  score?: number; // Will be calculated later
}

export function ScoreIndicator({ 
  sectionTitle, 
  questionsAnswered, 
  totalQuestions, 
  score 
}: ScoreIndicatorProps) {
  const isComplete = questionsAnswered === totalQuestions;
  const progressText = `${questionsAnswered}/${totalQuestions} questions`;
  const progressPercentage = (questionsAnswered / totalQuestions) * 100;
  const { t } = useTranslation('audit');

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-3">
            <h4 className="font-semibold text-base text-foreground">{sectionTitle}</h4>
            <p className="text-sm text-muted-foreground">{progressText}</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center">
            {score !== undefined ? (
              <Badge variant="secondary" size="lg" className="font-mono">
                {score}%
              </Badge>
            ) : (
              <Badge 
                variant={isComplete ? "success" : "outline"}
                size="default"
              >
                {isComplete ? t('score_indicator.complete') : t('score_indicator.in_progress')}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}