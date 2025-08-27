import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { TypingDots } from '@/components/chat/TypingDots';
import { useAuditProgressStore } from './AuditProgressStore';
import { QuestionRenderer } from './QuestionRenderer';
import { ProgressBar } from './ProgressBar';
import { ScoreIndicator } from './ScoreIndicator';
import { calculateTypingDelay } from '@/lib/typingUtils';
import { LogsToggle } from './LogsToggle';
import { loadAuditConfig } from './config.loader';
import type { AuditConfig } from './types';

interface AuditEngineProps {
  industry: 'dental' | 'hvac';
}

export function AuditEngine({ industry }: AuditEngineProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showCurrentQuestion, setShowCurrentQuestion] = useState(false);
  
  const {
    setVertical,
    loadConfig,
    currentSection,
    currentQuestion,
    currentSectionIndex,
    currentQuestionIndex,
    answers,
    setAnswer,
    next,
    back,
    restart,
    canGoBack,
    isAtEnd,
    getProgressPercentage,
    getTotalQuestions,
    scoreSummary
  } = useAuditProgressStore();

  // Load audit configuration
  useEffect(() => {
    const initializeAudit = async () => {
      try {
        setVertical(industry);
        const config = loadAuditConfig(industry);
        loadConfig(config);
        setIsLoading(false);
        
        // Show current question after a brief delay
        setTimeout(() => {
          setShowCurrentQuestion(true);
        }, 500);
      } catch (error) {
        console.error('Failed to load audit config:', error);
        setIsLoading(false);
      }
    };

    initializeAudit();
  }, [industry, setVertical, loadConfig]);

  const handleAnswerChange = (value: unknown) => {
    if (currentQuestion) {
      setAnswer(currentQuestion.id, value);
    }
  };

  const handleNext = () => {
    if (isAtEnd()) {
      // Navigate to money lost page
      navigate('/moneylost');
    } else {
      setShowCurrentQuestion(false);
      setTimeout(() => {
        next();
        setShowCurrentQuestion(true);
      }, 200);
    }
  };

  const handleBack = () => {
    setShowCurrentQuestion(false);
    setTimeout(() => {
      back();
      setShowCurrentQuestion(true);
    }, 200);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-20">
          <div className="flex items-center justify-center h-64">
            <TypingDots />
          </div>
        </div>
      </div>
    );
  }

  if (!currentSection || !currentQuestion) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-20">
          <div className="text-center">
            <p className="text-destructive">Failed to load audit questions</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Progress Bar */}
      <ProgressBar
        currentSection={currentSectionIndex}
        currentQuestion={currentQuestionIndex}
        totalQuestionsInSection={currentSection.questions.length}
        progressPercentage={getProgressPercentage()}
        overallScore={scoreSummary.overall}
        onRestart={restart}
      />

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto px-4 pt-24 pb-8">
        {/* Section Header (only show on first question of section) */}
        {currentQuestionIndex === 0 && (
          <div className="mb-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {currentSection.preHeadline}
            </p>
            <h2 className="text-2xl font-bold mb-4">
              {currentSection.headline}
            </h2>
            <p className="text-muted-foreground">
              {currentSection.description}
            </p>
          </div>
        )}

        {/* Chat Interface */}
        <div className="space-y-6 mb-8">
          {/* Section Progress Indicators */}
          <div className="grid gap-3 mb-6">
            <ScoreIndicator
              sectionTitle={currentSection.headline}
              questionsAnswered={currentQuestionIndex + (answers[currentQuestion.id] ? 1 : 0)}
              totalQuestions={currentSection.questions.length}
            />
          </div>

          {/* Current Question */}
          {showCurrentQuestion ? (
            <div className="bg-card rounded-lg border p-6">
              <QuestionRenderer
                question={currentQuestion}
                value={answers[currentQuestion.id]}
                onValueChange={handleAnswerChange}
                onNext={handleNext}
                onBack={handleBack}
                canGoBack={canGoBack()}
              />
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <TypingDots />
            </div>
          )}

          {/* Completion CTA */}
          {isAtEnd() && answers[currentQuestion.id] && (
            <div className="text-center pt-6 border-t">
              <h3 className="text-lg font-medium mb-2">
                Great! You've completed the audit.
              </h3>
              <p className="text-muted-foreground mb-4">
                Let's see how much money you could be losing and how our AI assistant can help.
              </p>
              <Button 
                onClick={() => navigate('/moneylost')}
                size="lg"
                className="bg-brand-gradient hover:opacity-90 text-white"
              >
                See how much you're losing
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Logs Toggle */}
      <LogsToggle />
    </div>
  );
}