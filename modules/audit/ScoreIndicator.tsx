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

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="font-medium text-sm">{sectionTitle}</h4>
            <p className="text-xs text-muted-foreground">{progressText}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {score !== undefined ? (
              <Badge variant="secondary" className="font-mono">
                {score}%
              </Badge>
            ) : (
              <Badge variant={isComplete ? "default" : "outline"}>
                {isComplete ? "Complete" : "In Progress"}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}