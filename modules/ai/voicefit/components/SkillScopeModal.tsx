import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ExternalLink, CheckCircle, Clock, DollarSign, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { requestSkillScope, type SkillScopeResponse } from "@modules/ai/skillscope/client";
import type { SkillScopeInput } from "@modules/ai/skillscope/types";

interface SkillScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillData: {
    id: string;
    name: string;
    target: "Dental" | "HVAC" | "Both";
    problem: string;
    how: string;
    roiRangeMonthly?: [number, number];
    tags?: string[];
  };
  context: {
    auditId: string;
    auditType: "dental" | "hvac";
    business?: {
      name?: string;
      location?: string;
      size?: { chairs?: number; techs?: number };
    };
    settings?: {
      currency?: "USD" | "EUR";
      locale?: "en-US" | "it-IT";
    };
  };
  kb?: {
    approved_claims: string[];
    services: Array<{
      name: string;
      target: "Dental" | "HVAC" | "Both";
      problem: string;
      how: string;
      roiRangeMonthly?: [number, number];
      tags?: string[];
    }>;
    case_studies?: Array<{
      skillName: string;
      vertical: "Dental" | "HVAC";
      metric: string;
      timeframe?: string;
    }>;
  };
}

export function SkillScopeModal({ 
  isOpen, 
  onClose, 
  skillData, 
  context,
  kb 
}: SkillScopeModalProps) {
  const skillScopeInput: SkillScopeInput = React.useMemo(() => ({
    context,
    skill: skillData,
    kb: kb || {
      approved_claims: [],
      services: [skillData],
    },
  }), [context, skillData, kb]);

  const { data: skillScope, isLoading, error } = useQuery({
    queryKey: ['skillscope', skillData.id, context.auditId],
    queryFn: () => requestSkillScope(skillScopeInput),
    enabled: isOpen,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const symbol = currency === 'USD' ? '$' : '€';
    return `${symbol}${amount.toLocaleString()}`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            SkillScope™ - {skillData.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-muted-foreground">Generating SkillScope analysis...</p>
            </div>
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="p-6 text-center">
              <p className="text-destructive">
                {error instanceof Error ? error.message : 'Failed to generate SkillScope'}
              </p>
            </CardContent>
          </Card>
        )}

        {skillScope && !skillScope.success && (
          <Card className="border-destructive">
            <CardContent className="p-6 text-center">
              <p className="text-destructive">
                {skillScope.error?.message || 'Failed to generate SkillScope'}
              </p>
              {skillScope.metadata?.warnings && (
                <div className="mt-2 space-y-1">
                  {skillScope.metadata.warnings.map((warning, index) => (
                    <p key={index} className="text-sm text-muted-foreground">
                      {warning}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {skillScope?.success && skillScope.skillScope && (
          <div className="space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {skillScope.skillScope.header.skill_name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary">
                        {skillScope.skillScope.header.vertical}
                      </Badge>
                      <Badge variant="outline">
                        {skillScope.skillScope.header.business_size} Business
                      </Badge>
                    </div>
                  </div>
                  {skillScope.confidence_score && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <p className="text-lg font-semibold text-primary">
                        {skillScope.confidence_score}%
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground mt-3">
                  {skillScope.skillScope.header.summary}
                </p>
              </CardHeader>
            </Card>

            {/* Revenue Impact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>Revenue Impact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg font-medium text-foreground">
                  {skillScope.skillScope.revenue_impact.statement}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Monthly ROI</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(
                        skillScope.skillScope.revenue_impact.expected_roi_monthly,
                        skillScope.skillScope.revenue_impact.currency
                      )}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="text-2xl font-bold text-primary">
                      {skillScope.skillScope.revenue_impact.confidence}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Formula</p>
                    <p className="text-sm font-medium text-foreground">
                      {skillScope.skillScope.revenue_impact.formula}
                    </p>
                  </div>
                </div>
                {skillScope.skillScope.revenue_impact.assumptions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Assumptions:</p>
                    <ul className="space-y-1">
                      {skillScope.skillScope.revenue_impact.assumptions.map((assumption, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                          <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                          <span>{assumption}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* What It Does */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <span>What It Does</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {skillScope.skillScope.what_it_does}
                  </p>
                </CardContent>
              </Card>

              {/* How It Works */}
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Trigger:</p>
                    <p className="text-sm">{skillScope.skillScope.how_it_works.trigger}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Process:</p>
                    <p className="text-sm">{skillScope.skillScope.how_it_works.process}</p>
                  </div>
                  {skillScope.skillScope.how_it_works.actions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Key Actions:</p>
                      <ul className="space-y-1">
                        {skillScope.skillScope.how_it_works.actions.map((action, index) => (
                          <li key={index} className="text-sm flex items-start space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Key Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Key Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {skillScope.skillScope.key_benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Implementation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span>Implementation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="px-3 py-1">
                    {skillScope.skillScope.implementation.timeline_weeks} weeks
                  </Badge>
                  <span className="text-sm text-muted-foreground">Timeline</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Implementation Phases:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {skillScope.skillScope.implementation.phases.map((phase, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-xs font-medium text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-sm">{phase}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proven Results */}
            <Card>
              <CardHeader>
                <CardTitle>Proven Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {skillScope.skillScope.proven_results.stats.map((stat, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{stat}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <p className="text-sm text-muted-foreground">
                  {skillScope.skillScope.proven_results.typical_for_size}
                </p>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Prerequisites:</p>
                  <ul className="space-y-1">
                    {skillScope.skillScope.requirements.prerequisites.map((req, index) => (
                      <li key={index} className="text-sm flex items-start space-x-2">
                        <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Data Needed:</p>
                  <ul className="space-y-1">
                    {skillScope.skillScope.requirements.data_needed.map((data, index) => (
                      <li key={index} className="text-sm flex items-start space-x-2">
                        <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                        <span>{data}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  onClick={() => window.open(skillScope.skillScope!.cta.primary.url, '_blank')}
                >
                  {skillScope.skillScope.cta.primary.label}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                {skillScope.skillScope.cta.secondary.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Or explore:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {skillScope.skillScope.cta.secondary.map((action, index) => (
                        <Button key={index} variant="outline" size="sm" className="justify-start">
                          {action}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Warnings */}
            {skillScope.metadata?.warnings && skillScope.metadata.warnings.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardHeader>
                  <CardTitle className="text-sm text-yellow-800">Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {skillScope.metadata.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-700">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}