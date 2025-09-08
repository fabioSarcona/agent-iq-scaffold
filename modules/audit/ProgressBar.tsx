import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/hooks/useTranslation';

interface ProgressBarProps {
  currentSection: number;
  currentQuestion: number;
  totalQuestionsInSection: number;
  progressPercentage: number;
  overallScore: number;
  onRestart: () => void;
}

export function ProgressBar({
  currentSection,
  currentQuestion,
  totalQuestionsInSection,
  progressPercentage,
  overallScore,
  onRestart
}: ProgressBarProps) {
  const { t } = useTranslation('audit');
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-foreground">
            {t('progress.section')} {currentSection + 1} · {t('progress.question')} {currentQuestion + 1}/{totalQuestionsInSection}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-xs font-medium text-muted-foreground">
              {t('progress.overall_score')}: <span className="text-primary">{overallScore}/100</span>
            </div>
            <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                {t('progress.restart_audit')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('progress.restart_title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('progress.restart_description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('progress.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={onRestart}>
                  {t('progress.yes_restart')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <Progress value={progressPercentage} className="h-2" />
      </div>
    </div>
  );
}