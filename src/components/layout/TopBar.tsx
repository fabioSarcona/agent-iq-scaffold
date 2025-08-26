import { Button } from '@/components/ui/button'
import { Moon, Sun, RotateCcw } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'
import { useAuditProgressStore } from '@/stores/auditProgressStore'
import { ProgressBar } from '@/components/ui/progress-bar'
import { auditLogger } from '@/lib/auditLogger'

export function TopBar() {
  const { theme, setTheme } = useTheme()
  const { 
    auditStarted, 
    currentQuestionIndex, 
    auditQuestions, 
    restartAudit,
    industry 
  } = useAuditProgressStore()

  const handleRestartAudit = () => {
    restartAudit()
    auditLogger.log({
      type: 'restart',
      industry
    })
  }

  const progress = auditQuestions.length > 0 
    ? Math.round(((currentQuestionIndex + 1) / auditQuestions.length) * 100)
    : 0

  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur-sm px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold bg-brand-gradient bg-clip-text text-transparent">
          NeedAgent Business Audit
        </h1>
        
        {auditStarted && auditQuestions.length > 0 && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {auditQuestions.length}
            </span>
            <div className="w-32">
              <ProgressBar progress={progress} showPercentage={false} />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {auditStarted && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestartAudit}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restart audit
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  )
}