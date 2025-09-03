import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

  return (
    <Card className="w-full hover-glow">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <h4 className="font-semibold text-sm md:text-base">{sectionTitle}</h4>
            <p className="text-xs md:text-sm text-muted-foreground">{progressText}</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-secondary/50 rounded-full h-2 mt-3">
              <div
                className="bg-gradient-glow h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {score !== undefined ? (
              <Badge variant="secondary" className="font-mono font-semibold text-sm px-3 py-1">
                {score}%
              </Badge>
            ) : (
              <Badge 
                variant={isComplete ? "default" : "outline"}
                className={isComplete ? "bg-gradient-glow text-primary-foreground font-semibold" : ""}
              >
                {isComplete ? "Complete" : "In Progress"}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}