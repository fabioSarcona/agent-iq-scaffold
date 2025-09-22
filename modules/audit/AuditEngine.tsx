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
import { featureFlags } from '@/env';
import { NeedAgentIQDebugger } from './NeedAgentIQDebugger';

// FASE 6: Client-side security policy (mirrors edge function policy)
const CLIENT_SECTION_POLICY: Record<string, {
  allowSkills: boolean;
  allowROI: boolean;
  allowedServiceIds: string[];
}> = {
  section_1: {
    allowSkills: false,
    allowROI: false,
    allowedServiceIds: ['appointment_booking']
  },
  section_2: {
    allowSkills: false,
    allowROI: false,
    allowedServiceIds: ['appointment_booking', 'lead_qualification']
  },
  section_3: {
    allowSkills: true,
    allowROI: true,
    allowedServiceIds: ['appointment_booking', 'lead_qualification', 'emergency_routing', 'payment_processing']
  },
  section_4: {
    allowSkills: true,
    allowROI: true,
    allowedServiceIds: ['appointment_booking', 'lead_qualification', 'emergency_routing', 'payment_processing']
  },
  section_5: {
    allowSkills: true,
    allowROI: true,
    allowedServiceIds: ['appointment_booking', 'lead_qualification', 'emergency_routing', 'payment_processing']
  },
  section_6: {
    allowSkills: true,
    allowROI: true,
    allowedServiceIds: ['appointment_booking', 'lead_qualification', 'emergency_routing', 'payment_processing']
  },
  section_7: {
    allowSkills: true,
    allowROI: true,
    allowedServiceIds: ['appointment_booking', 'lead_qualification', 'emergency_routing', 'payment_processing']
  }
};

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
      logger.event('audit_complete', { 
        industry, 
        totalQuestions: getTotalQuestions(),
        answeredQuestions: Object.keys(answers).length 
      });
      // Navigate to money lost page when audit is complete
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
    
    // FASE 7: Start debug session
    const startTime = Date.now();
    const policy = CLIENT_SECTION_POLICY[currentSection?.id || 'section_1'] || CLIENT_SECTION_POLICY.section_3;
    const mode = policy.allowSkills ? 'skills' : 'foundational';
    
    if (currentSection?.id) {
      NeedAgentIQDebugger.startSession(currentSection.id, mode, policy);
    }
    
    console.log('🐛 DEBUG: triggerNeedAgentIQIfReady called:', {
      currentSectionId: currentSection?.id,
      hasCurrentSection: !!currentSection,
      vertical,
      totalAnswers: Object.keys(answers).length,
      useRoiBrainNeedAgentIQ: featureFlags.shouldUseRoiBrainNeedAgentIQ(),
      shouldUseRoiBrain: featureFlags.shouldUseRoiBrain(),
      timestamp: new Date().toISOString(),
      debugMode: mode,
      policy: policy
    });
    
    if (!currentSection) {
      console.log('🐛 DEBUG: No current section, returning');
      return;
    }
    
    // FASE 2.2: Skip standalone ai_needagentiq only if ROI Brain insights already exist
    const hasROIBrainInsights = state.insights.some(i => i.sectionId === 'roi_brain_generated');
    const shouldSkipStandalone = featureFlags.shouldUseRoiBrainNeedAgentIQ() && hasROIBrainInsights;
    
    console.log('🐛 DEBUG: FASE 2.2 Fix - Smart skip logic:', {
      roiBrainNeedAgentIQEnabled: featureFlags.shouldUseRoiBrainNeedAgentIQ(),
      hasROIBrainInsights,
      shouldSkipStandalone,
      currentInsightsCount: state.insights.length,
      roiBrainInsightKeys: state.insights.filter(i => i.sectionId === 'roi_brain_generated').map(i => i.key),
      timestamp: new Date().toISOString()
    });
    
    if (shouldSkipStandalone) {
      console.log('🐛 DEBUG: ✅ SKIPPING - ROI Brain insights already populated');
      logger.event('needagentiq_skip', { 
        sectionId: currentSection.id, 
        reason: 'roi_brain_insights_already_exist',
        roiBrainInsightsCount: state.insights.filter(i => i.sectionId === 'roi_brain_generated').length,
        timestamp: new Date().toISOString()
      });
      return;
    } else {
      console.log('🐛 DEBUG: ⚡ PROCEEDING - Using legacy ai_needagentiq for immediate insights');
    }
    
    // Get answers for current section only
    const sectionAnswers = currentSection.questions.reduce((acc, question) => {
      const answer = answers[question.id];
      if (answer !== undefined && answer !== null && answer !== '') {
        acc[question.id] = answer;
      }
      return acc;
    }, {} as Record<string, unknown>);
    
    const meaningfulCount = Object.keys(sectionAnswers).length;
    
    console.log('🐛 DEBUG: Section answers analysis:', {
      sectionId: currentSection.id,
      totalQuestions: currentSection.questions.length,
      meaningfulCount,
      sectionAnswers,
      questionIds: currentSection.questions.map(q => q.id)
    });
    
    // Only trigger if section has ≥3 meaningful answers
    if (meaningfulCount < 3) {
      console.log('🐛 DEBUG: Insufficient answers, skipping NeedAgentIQ');
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
    
    console.log('🐛 DEBUG: Deduplication check:', {
      sectionId: currentSection.id,
      existingInsight: existingInsight ? existingInsight.key : 'none',
      totalExistingInsights: state.insights.length,
      allInsightKeys: state.insights.map(i => i.key)
    });
    
    if (existingInsight) {
      console.log('🐛 DEBUG: Already has insight, skipping');
      logger.event('needagentiq_skip', { 
        sectionId: currentSection.id, 
        meaningfulCount,
        reason: 'already_has_insight'
      });
      return;
    }
    
    try {
      console.log('🐛 DEBUG: Starting NeedAgentIQ request');
      logger.event('needagentiq_request_start', { 
        sectionId: currentSection.id, 
        meaningfulCount 
      });
      
      const requestBody = {
        vertical: vertical || 'dental',
        sectionId: currentSection.id,
        answersSection: sectionAnswers,
        moneyLostData: state.moneyLostByArea || {}, // Pass money lost data for ROI calculations
        language: 'en' // Fixed to English for now, ready for multilingual
      };
      
      console.log('🐛 DEBUG: Request body:', requestBody);
      
      const { data, error } = await supabase.functions.invoke('ai_needagentiq', {
        body: requestBody
      });
      
      console.log('🐛 DEBUG: Supabase function response:', {
        hasData: !!data,
        dataType: typeof data,
        isArray: Array.isArray(data),
        dataLength: Array.isArray(data) ? data.length : 'not-array',
        data: data,
        hasError: !!error,
        error: error
      });
      
      if (error) {
        console.log('🐛 DEBUG: Supabase function error:', error);
        throw new Error(error.message || 'NeedAgentIQ request failed');
      }
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('🐛 DEBUG: Processing insights data:', {
          count: data.length,
          insights: data
        });
        
        // Add sectionId to insights for better deduplication
        const enrichedInsights = data.map((insight, index) => ({
          ...insight,
          sectionId: currentSection.id,
          key: insight.key || `section_${currentSection.id}_${index}`
        }));
        
        // Log seed verification for debugging
        const seedInsights = enrichedInsights.filter(i => i.source === 'seed');
        const realInsights = enrichedInsights.filter(i => i.source !== 'seed');
        console.log('🐛 DEBUG: Insight source verification:', {
          sectionId: currentSection.id,
          totalInsights: enrichedInsights.length,
          seedCount: seedInsights.length,
          realCount: realInsights.length,
          seedInsights: seedInsights.map(i => ({ key: i.key, source: i.source, title: i.title?.slice(0, 30) })),
          realInsights: realInsights.map(i => ({ key: i.key, source: i.source, title: i.title?.slice(0, 30) }))
        });
        
        console.log('🐛 DEBUG: Enriched insights:', enrichedInsights);
        
        // FASE 7: Log server response for debugging
        const serverResponseTime = Date.now() - startTime;
        if (currentSection?.id) {
          NeedAgentIQDebugger.logServerResponse(currentSection.id, enrichedInsights, serverResponseTime);
        }
        
        // FASE 6: Client-side security filter before appending insights
        const policy = CLIENT_SECTION_POLICY[currentSection.id] || CLIENT_SECTION_POLICY.section_3;
        const preFilterCount = enrichedInsights.length;
        
        const filteredInsights = enrichedInsights.filter(insight => {
          const okSkill = policy.allowSkills ? true : !insight.skill?.id;
          const okService = insight.skill?.id ? policy.allowedServiceIds.includes(insight.skill.id) : true;
          const okROI = policy.allowROI ? true : (insight.monthlyImpactUsd || 0) === 0;
          
          const passed = okSkill && okService && okROI;
          if (!passed) {
            console.log('🚫 CLIENT FILTER: Insight blocked:', {
              title: insight.title,
              skillId: insight.skill?.id,
              monthlyImpact: insight.monthlyImpactUsd,
              sectionId: currentSection.id,
              reasons: {
                skill: !okSkill ? 'skills not allowed in this section' : 'ok',
                service: !okService ? 'service not allowed in this section' : 'ok',
                roi: !okROI ? 'ROI not allowed in this section' : 'ok'
              }
            });
          }
          
          return passed;
        });
        
        console.log('✅ CLIENT FILTER: Applied security policy:', {
          sectionId: currentSection.id,
          preFilter: preFilterCount,
          postFilter: filteredInsights.length,
          blocked: preFilterCount - filteredInsights.length,
          policy: {
            allowSkills: policy.allowSkills,
            allowROI: policy.allowROI,
            allowedServiceIds: policy.allowedServiceIds
          }
        });
        
        // FASE 7: Log client filtering for debugging
        const blockedInsights = enrichedInsights.filter(insight => !filteredInsights.includes(insight));
        if (currentSection?.id) {
          NeedAgentIQDebugger.logClientFilter(currentSection.id, preFilterCount, filteredInsights.length, blockedInsights);
        }
        
        appendInsights(currentSection.id, filteredInsights);
        
        // FASE 7: Complete debug session and generate summary in dev mode
        const totalTime = Date.now() - startTime;
        if (currentSection?.id) {
          NeedAgentIQDebugger.completeSession(currentSection.id, totalTime);
          
          // Auto-generate summary in development
          if (import.meta.env.DEV) {
            NeedAgentIQDebugger.generateSummary(currentSection.id);
          }
        }
        
        logger.event('needagentiq_request_success', { 
          sectionId: currentSection.id, 
          insights: filteredInsights.length,
          blocked: blockedInsights.length,
          totalTimeMs: totalTime
        });
      } else {
        console.log('🐛 DEBUG: No insights returned or empty array:', {
          data,
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 'not-array'
        });
      }
    } catch (error: any) {
      console.log('🐛 DEBUG: NeedAgentIQ error:', {
        error,
        message: error?.message,
        stack: error?.stack?.slice(0, 300)
      });
      
      const errorMsg = error?.message?.slice(0, 160) || 'NeedAgentIQ failed';
      setIqError(currentSection.id, errorMsg);
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
              <div className="mb-6">
                <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded">1</span>
                  <span>Audit Complete</span>
                  <span>→</span>
                  <span className="bg-muted px-2 py-1 rounded">2</span>
                  <span>Money Lost Analysis</span>
                  <span>→</span>
                  <span className="bg-muted px-2 py-1 rounded">3</span>
                  <span>Report</span>
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">
                {t('completion.title')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('completion.description')}
              </p>
              <Button 
                onClick={() => navigate('/moneylost')}
                size="lg"
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow"
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