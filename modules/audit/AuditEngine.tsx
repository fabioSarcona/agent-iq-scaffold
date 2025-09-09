import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { TypingDots } from '@/components/chat/TypingDots';
import { useAuditProgressStore } from './AuditProgressStore';
import { QuestionRenderer } from './QuestionRenderer';
import { ProgressBar } from './ProgressBar';
import { ScoreIndicator } from './ScoreIndicator';
import { useTranslation } from '@/hooks/useTranslation';
/**
 * Calculate typing delay based on message length
 * ≤20 chars: 100+20ms/char
 * 21–60 chars: 300+15ms/char  
 * >60 chars: 500+10ms/char
 */
function calculateTypingDelay(message: string): number {
  const length = message.length
  
  if (length <= 20) {
    return 100 + (20 * length)
  } else if (length <= 60) {
    return 300 + (15 * length)
  } else {
    return 500 + (10 * length)
  }
}
import { LogsToggle } from './LogsToggle';
import { loadAuditConfig } from './config.loader';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

interface AuditEngineProps {
  industry: 'dental' | 'hvac';
}

export function AuditEngine({ industry }: AuditEngineProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showCurrentQuestion, setShowCurrentQuestion] = useState(false);
  const { t } = useTranslation('audit');
  
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
    scoreSummary,
    isSectionComplete,
    appendInsights,
    setIqError
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
        logger.error('Failed to load audit config', { error: error.message });
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

  const handleNext = async () => {
    if (isAtEnd()) {
      // Navigate to money lost page
      navigate('/moneylost');
    } else {
      setShowCurrentQuestion(false);
      
      // Check if this move will complete a section
      const state = useAuditProgressStore.getState();
      const willCompleteSection = currentSection && 
        currentQuestionIndex === currentSection.questions.length - 1;
      
      if (willCompleteSection) {
        logger.event('section_complete', {
          sectionId: currentSection.id,
          sectionIndex: currentSectionIndex,
          questionsAnswered: currentSection.questions.length
        });
        await triggerNeedAgentIQIfReady();
      }
      
      setTimeout(() => {
        next();
        setShowCurrentQuestion(true);
      }, 200);
    }
  };

  const triggerNeedAgentIQIfReady = async () => {
    const state = useAuditProgressStore.getState();
    const { vertical, answers, appendInsights, setIqError } = state;
    
    if (!currentSection) return;
    
    // Get answers for current section only
    const sectionAnswers = currentSection.questions.reduce((acc, question) => {
      const answer = answers[question.id];
      if (answer !== undefined && answer !== null && answer !== '') {
        acc[question.id] = answer;
      }
      return acc;
    }, {} as Record<string, unknown>);
    
    const meaningfulCount = Object.keys(sectionAnswers).length;
    
    // Only trigger if section has ≥3 meaningful answers
    if (meaningfulCount < 3) {
      logger.event('needagentiq_skip', { 
        sectionId: currentSection.id, 
        meaningfulCount,
        reason: 'insufficient_answers'
      });
      return;
    }
    
    // Check if we already have insights for this section (deduplication)
    const existingInsight = state.insights.find(insight => 
      insight.key === `section_${currentSection.id}` || 
      insight.sectionId === currentSection.id
    );
    
    if (existingInsight) {
      logger.event('needagentiq_skip', { 
        sectionId: currentSection.id, 
        meaningfulCount,
        reason: 'already_has_insight'
      });
      return;
    }
    
    try {
      logger.event('needagentiq_request_start', { 
        sectionId: currentSection.id, 
        meaningfulCount 
      });
      
      const { data, error } = await supabase.functions.invoke('ai_needagentiq', {
        body: {
          vertical: vertical || 'dental',
          sectionId: currentSection.id,
          answersSection: sectionAnswers
        }
      });
      
      if (error) throw new Error(error.message || 'NeedAgentIQ request failed');
      
      if (Array.isArray(data) && data.length > 0) {
        // Add sectionId to insights for better deduplication
        const enrichedInsights = data.map(insight => ({
          ...insight,
          sectionId: currentSection.id,
          key: insight.key || `section_${currentSection.id}`
        }));
        
        appendInsights(currentSection.id, enrichedInsights);
        logger.event('needagentiq_request_success', { 
          sectionId: currentSection.id, 
          insights: data.length 
        });
      }
    } catch (error: any) {
      const errorMsg = error?.message?.slice(0, 160) || 'NeedAgentIQ failed';
      setIqError(errorMsg);
      logger.error('needagentiq_request_error', { 
        sectionId: currentSection.id, 
        msg: errorMsg 
      });
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
            <p className="text-destructive">{t('errors.failed_to_load')}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              {t('errors.retry')}
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
                {t('completion.title')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('completion.description')}
              </p>
              <Button 
                onClick={() => navigate('/moneylost')}
                size="lg"
                className="bg-brand-gradient hover:opacity-90 text-white"
              >
                {t('completion.button')}
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