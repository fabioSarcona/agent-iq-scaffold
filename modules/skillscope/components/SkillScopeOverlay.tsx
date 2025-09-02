import { useState, useEffect } from "react";
import { X, Loader2, AlertTriangle, TrendingUp, Clock, CheckCircle, Target, Zap } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { requestSkillScope } from "../client";
import { KeyValue } from "./KeyValue";
import type { SkillScopePayload } from "../types";
import type { SkillScopeOutput } from "@/lib/schemas/skillscope";

interface SkillScopeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  payload: SkillScopePayload;
}

export function SkillScopeOverlay({ isOpen, onClose, payload }: SkillScopeOverlayProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SkillScopeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setData(null);
      setError(null);
      return;
    }

    const abortController = new AbortController();
    
    const fetchSkillScope = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await requestSkillScope(payload, abortController.signal);
        setData(result);
        
        if (!result.success) {
          setError(result.error?.message || "Failed to generate SkillScope brief");
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSkillScope();

    return () => {
      abortController.abort();
    };
  }, [isOpen, payload]);

  const skillScope = data?.skillScope;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[760px] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">
              {skillScope?.header.skill_name || payload.skill.name}
            </h2>
            {skillScope?.header.summary && (
              <p className="text-sm text-muted-foreground mt-1">
                {skillScope.header.summary}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Generating SkillScope brief...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <AlertTriangle className="h-8 w-8 mx-auto text-destructive" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {skillScope && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{skillScope.header.vertical}</Badge>
                <Badge variant="outline">{skillScope.header.business_size} Business</Badge>
                {data?.confidence_score && (
                  <Badge variant="secondary">
                    {Math.round(data.confidence_score * 100)}% Confidence
                  </Badge>
                )}
              </div>

              {/* What it does */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    What it does
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{skillScope.what_it_does}</p>
                </CardContent>
              </Card>

              {/* How it works */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    How it works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <KeyValue label="Trigger" value={skillScope.how_it_works.trigger} />
                  <KeyValue label="Process" value={skillScope.how_it_works.process} />
                  <KeyValue label="Actions" value={skillScope.how_it_works.actions} />
                  <KeyValue label="Integrations" value={skillScope.how_it_works.integrations} />
                  <KeyValue label="Follow-up" value={skillScope.how_it_works.follow_up} />
                </CardContent>
              </Card>

              {/* Revenue Impact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Revenue Impact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>{skillScope.revenue_impact.statement}</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-primary">
                      {skillScope.revenue_impact.currency === "EUR" ? "€" : "$"}
                      {skillScope.revenue_impact.expected_roi_monthly.toLocaleString()}/month
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(skillScope.revenue_impact.confidence * 100)}% confidence
                    </div>
                  </div>
                  <KeyValue label="Formula" value={skillScope.revenue_impact.formula} />
                  <KeyValue label="Assumptions" value={skillScope.revenue_impact.assumptions} />
                </CardContent>
              </Card>

              {/* Key Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Key Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <KeyValue label="" value={skillScope.key_benefits} />
                </CardContent>
              </Card>

              {/* Implementation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Implementation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-lg font-medium">
                    {skillScope.implementation.timeline_weeks} weeks timeline
                  </div>
                  <KeyValue label="Phases" value={skillScope.implementation.phases} />
                </CardContent>
              </Card>

              {/* Proven Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Proven Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <KeyValue label="Statistics" value={skillScope.proven_results.stats} />
                  <p className="text-sm text-muted-foreground">
                    {skillScope.proven_results.typical_for_size}
                  </p>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <KeyValue label="Prerequisites" value={skillScope.requirements.prerequisites} />
                  <KeyValue label="Data Needed" value={skillScope.requirements.data_needed} />
                </CardContent>
              </Card>

              {/* CTA */}
              <div className="space-y-3 pt-4">
                <Button className="w-full" onClick={() => window.open(skillScope.cta.primary.url, '_blank')}>
                  {skillScope.cta.primary.label}
                </Button>
                {skillScope.cta.secondary.length > 0 && (
                  <div className="text-center space-y-1">
                    {skillScope.cta.secondary.map((text, index) => (
                      <p key={index} className="text-sm text-muted-foreground">{text}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}