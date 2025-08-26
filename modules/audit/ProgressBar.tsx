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

interface ProgressBarProps {
  currentSection: number;
  currentQuestion: number;
  totalQuestionsInSection: number;
  progressPercentage: number;
  onRestart: () => void;
}

export function ProgressBar({
  currentSection,
  currentQuestion,
  totalQuestionsInSection,
  progressPercentage,
  onRestart
}: ProgressBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-foreground">
            Section {currentSection + 1} · Q {currentQuestion + 1}/{totalQuestionsInSection}
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                Restart audit
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restart audit?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all your answers and start the audit from the beginning. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onRestart}>
                  Yes, restart
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <Progress value={progressPercentage} className="h-2" />
      </div>
    </div>
  );
}