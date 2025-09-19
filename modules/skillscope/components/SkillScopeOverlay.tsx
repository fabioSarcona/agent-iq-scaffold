import { useState, useEffect, useMemo } from "react";
import { X, Loader2, AlertTriangle, TrendingUp, Clock, CheckCircle, Target, Zap, ExternalLink, Info } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requestSkillScope } from "../client";
import { KeyValue } from "./KeyValue";
import { PhaseTimeline } from "./PhaseTimeline";
import type { SkillScopeItem, SkillScopeContext, SkillScopePayload } from "../types";
import type { SkillScopeOutput } from "@/lib/schemas/skillscope";
import { useTranslation } from "react-i18next";
import { logger } from '@/lib/logger';

// ROI Brain-First Props (Phase 5.3)
interface SkillScopeOverlayProps {
  isOpen: boolean;
  skillId: string;                    // anchor key
  context?: SkillScopeContext;        // ROI Brain first
  fallbackPayload?: SkillScopePayload; // API fallback only if needed
  onClose: () => void;
}

type DataState = 'loading' | 'ready' | 'partial' | 'empty' | 'error';

export function SkillScopeOverlay({ 
  isOpen, 
  skillId, 
  context, 
  fallbackPayload, 
  onClose 
}: SkillScopeOverlayProps) {
  const { t } = useTranslation('report');
  const [state, setState] = useState<DataState>('loading');
  const [apiData, setApiData] = useState<SkillScopeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ROI Brain-First Data Selection
  const roiItem = useMemo(() => 
    context?.items.find(item => item.skillId === skillId),
    [context, skillId]
  );

  // Determine if we need API fallback
  const needsApiFallback = useMemo(() => {
    if (!roiItem) return true; // No ROI data
    
    // Check if ROI data is complete enough
    const hasBasics = roiItem.title && roiItem.summary;
    const hasImplementation = roiItem.phases && roiItem.phases.length > 0;
    const hasImpact = roiItem.monthlyImpactUsd !== undefined;
    
    return !hasBasics || (!hasImplementation && !hasImpact);
  }, [roiItem]);

  // Merged data (ROI Brain + API when needed)
  const mergedData = useMemo(() => {
    if (!roiItem && !apiData?.skillScope) return null;

    // If we have complete ROI data, use it
    if (roiItem && !needsApiFallback) {
      setState('ready');
      return roiItem;
    }

    // If we have both ROI and API, merge them (ROI Brain wins on strategic fields)
    if (roiItem && apiData?.skillScope) {
      const apiSkill = apiData.skillScope;
      setState('ready');
      
      return {
        ...roiItem,
        // Merge integrations
        integrations: Array.from(new Set([
          ...(roiItem.integrations ?? []), 
          ...(apiSkill.how_it_works?.integrations ?? [])
        ])),
        // Use ROI phases if available, otherwise API phases
        phases: roiItem.phases?.length 
          ? roiItem.phases
          : apiSkill.implementation?.phases?.map((phase, index) => ({
              id: `phase-${index}`,
              title: phase,
              weeks: Math.ceil(apiSkill.implementation?.timeline_weeks ?? 4 / apiSkill.implementation?.phases?.length ?? 1),
              steps: [phase]
            })),
        // Add sources tracking
        sources: Array.from(new Set([
          ...(roiItem.sources ?? ['roi_brain']),
          'api'
        ]))
      } as SkillScopeItem;
    }

    // Only API data available
    if (apiData?.skillScope && !roiItem) {
      setState('ready');
      const apiSkill = apiData.skillScope;
      
      return {
        skillId,
        title: apiSkill.header.skill_name,
        summary: apiSkill.header.summary,
        integrations: apiSkill.how_it_works?.integrations,
        phases: apiSkill.implementation?.phases?.map((phase, index) => ({
          id: `phase-${index}`,
          title: phase,
          weeks: Math.ceil(apiSkill.implementation?.timeline_weeks ?? 4 / apiSkill.implementation?.phases?.length ?? 1),
          steps: [phase]
        })),
        monthlyImpactUsd: apiSkill.revenue_impact?.expected_roi_monthly,
        priority: apiSkill.revenue_impact?.expected_roi_monthly > 2000 ? 'high' : 
                 apiSkill.revenue_impact?.expected_roi_monthly > 500 ? 'medium' : 'low',
        sources: ['api']
      } as SkillScopeItem;
    }

    return null;
  }, [roiItem, apiData, skillId, needsApiFallback]);

  // API Fallback Effect
  useEffect(() => {
    if (!isOpen) {
      setState('loading');
      setApiData(null);
      setError(null);
      return;
    }

    // Log opening event
    logger.event('skillscope_opened', {
      skillId,
      has_roi_context: !!roiItem,
      needs_api_fallback: needsApiFallback,
      context_source: context?.source
    });

    // If we have complete ROI data, no need for API
    if (roiItem && !needsApiFallback) {
      setState('ready');
      return;
    }

    // If we have partial ROI data, mark as partial and fetch API
    if (roiItem && needsApiFallback) {
      setState('partial');
    }

    // No data at all
    if (!roiItem && !fallbackPayload) {
      setState('empty');
      return;
    }

    // Fetch API data
    if (fallbackPayload && needsApiFallback) {
      const abortController = new AbortController();
      
      const fetchApiData = async () => {
        setState(roiItem ? 'partial' : 'loading');
        
        try {
          const startTime = performance.now();
          const result = await requestSkillScope(fallbackPayload, abortController.signal);
          const processingTime = performance.now() - startTime;
          
          logger.event('skillscope_api_called', {
            skillId,
            success: result.success,
            processing_time_ms: processingTime
          });
          
          if (result.success) {
            setApiData(result);
          } else {
            setError(result.error?.message || "Failed to load additional details");
            setState(roiItem ? 'ready' : 'error');
          }
        } catch (err) {
          if (!abortController.signal.aborted) {
            setError("Network error loading details");
            setState(roiItem ? 'ready' : 'error');
          }
        }
      };

      fetchApiData();

      return () => {
        abortController.abort();
      };
    }
  }, [isOpen, skillId, roiItem, needsApiFallback, fallbackPayload, context?.source]);

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const symbol = currency === 'EUR' ? '€' : '$';
    return `${symbol}${amount.toLocaleString()}`;
  };

  // Get priority badge variant
  const getPriorityVariant = (priority?: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const skill = mergedData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[760px] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold">
                {skill?.title || `Skill ${skillId}`}
              </h2>
              {skill?.priority && (
                <Badge variant={getPriorityVariant(skill.priority)}>
                  {skill.priority} Priority
                </Badge>
              )}
            </div>
            
            {skill?.summary && (
              <p className="text-sm text-muted-foreground">
                {skill.summary}
              </p>
            )}
            
            {/* Data Source Indicator */}
            {skill?.sources && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {skill.sources.includes('roi_brain') && skill.sources.includes('api') 
                    ? t('skillscope.data_source.merge')
                    : skill.sources.includes('roi_brain')
                    ? t('skillscope.data_source.roi_brain') 
                    : t('skillscope.data_source.api')
                  }
                </Badge>
                {skill.monthlyImpactUsd && (
                  <Badge variant="secondary" className="text-xs">
                    {formatCurrency(skill.monthlyImpactUsd)}/month
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading State */}
          {state === 'loading' && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">{t('skillscope.loading')}</p>
              </div>
            </div>
          )}

          {/* Partial Data Alert */}
          {state === 'partial' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Loading additional implementation details...
              </AlertDescription>
            </Alert>
          )}

          {/* Empty State */}
          {state === 'empty' && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{t('skillscope.empty_state.title')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('skillscope.empty_state.desc')}
                  </p>
                </div>
                <Button variant="outline" onClick={onClose}>
                  {t('skillscope.empty_state.cta')}
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && !skill && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <AlertTriangle className="h-8 w-8 mx-auto text-destructive" />
                <div>
                  <h3 className="font-medium">Unable to Load Details</h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Main Content */}
          {skill && (state === 'ready' || state === 'partial') && (
            <div className="space-y-6">
              
              {/* Rationale */}
              {skill.rationale && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      {t('skillscope.rationale')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{skill.rationale}</p>
                  </CardContent>
                </Card>
              )}

              {/* What it does (fallback from API if available) */}
              {(skill.summary || apiData?.skillScope?.what_it_does) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      {t('skillscope.what_it_does')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{skill.summary || apiData?.skillScope?.what_it_does}</p>
                  </CardContent>
                </Card>
              )}

              {/* Integrations */}
              {skill.integrations && skill.integrations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      {t('skillscope.integrations')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {skill.integrations.map((integration, index) => (
                        <Badge key={index} variant="secondary">
                          {integration}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Implementation Phases */}
              {skill.phases && skill.phases.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {t('skillscope.phases')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PhaseTimeline phases={skill.phases} />
                  </CardContent>
                </Card>
              )}

              {/* Implementation Readiness */}
              {skill.implementationReadiness !== undefined && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      {t('skillscope.implementation_readiness')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Readiness Score</span>
                        <span className="font-medium">{skill.implementationReadiness}%</span>
                      </div>
                      <Progress value={skill.implementationReadiness} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Revenue Impact */}
              {skill.monthlyImpactUsd && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Revenue Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 border border-primary/10">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(skill.monthlyImpactUsd)}/month
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Estimated monthly impact
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* API Fallback Sections */}
              {apiData?.skillScope && (
                <>
                  {/* Key Benefits */}
                  {apiData.skillScope.key_benefits && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          {t('skillscope.key_benefits')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <KeyValue label="" value={apiData.skillScope.key_benefits} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Proven Results */}
                  {apiData.skillScope.proven_results && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('skillscope.proven_results')}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <KeyValue label="Statistics" value={apiData.skillScope.proven_results.stats} />
                        <p className="text-sm text-muted-foreground">
                          {apiData.skillScope.proven_results.typical_for_size}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Requirements */}
                  {apiData.skillScope.requirements && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('skillscope.requirements')}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <KeyValue label="Prerequisites" value={apiData.skillScope.requirements.prerequisites} />
                        <KeyValue label="Data Needed" value={apiData.skillScope.requirements.data_needed} />
                      </CardContent>
                    </Card>
                  )}

                  {/* CTA */}
                  {apiData.skillScope.cta && (
                    <div className="space-y-3 pt-4">
                      <Button 
                        className="w-full" 
                        onClick={() => window.open(apiData.skillScope.cta.primary.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {apiData.skillScope.cta.primary.label}
                      </Button>
                      {apiData.skillScope.cta.secondary.length > 0 && (
                        <div className="text-center space-y-1">
                          {apiData.skillScope.cta.secondary.map((text, index) => (
                            <p key={index} className="text-sm text-muted-foreground">{text}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}