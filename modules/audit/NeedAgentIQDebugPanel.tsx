import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NeedAgentIQDebugger, type NeedAgentIQDebugInfo, createDemoSession } from './NeedAgentIQDebugger';

// FASE 7: Debug panel component for DevConsole integration
export function NeedAgentIQDebugPanel() {
  const [debugSessions, setDebugSessions] = useState<Record<string, NeedAgentIQDebugInfo>>({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setDebugSessions(NeedAgentIQDebugger.getAllSessions());
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const refreshData = () => {
    setDebugSessions(NeedAgentIQDebugger.getAllSessions());
  };

  const clearSessions = () => {
    NeedAgentIQDebugger.clearSessions();
    setDebugSessions({});
  };

  const generateFullSummary = () => {
    NeedAgentIQDebugger.generateSummary();
  };

  const sessionEntries = Object.entries(debugSessions);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">NeedAgentIQ Debug Monitor</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={generateFullSummary}>
            Console Summary
          </Button>
          {import.meta.env.DEV && (
            <Button variant="secondary" size="sm" onClick={createDemoSession}>
              Create Demo
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={clearSessions}>
            Clear
          </Button>
        </div>
      </div>

      {sessionEntries.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                No debug sessions recorded yet. Start an audit to see debug information.
              </p>
              {import.meta.env.DEV && (
                <div className="bg-muted/20 p-4 rounded-lg text-left space-y-2">
                  <h4 className="text-sm font-semibold">Development Mode - Quick Start:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Click "Create Demo" to generate test data</li>
                    <li>• Start an audit to see live debug sessions</li>
                    <li>• Use browser console: <code className="bg-background px-1 rounded">NeedAgentIQDebugger.generateSummary()</code></li>
                    <li>• Call demo function: <code className="bg-background px-1 rounded">createDemoNeedAgentIQSession()</code></li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessionEntries.map(([sectionId, info]) => (
            <Card key={sectionId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{sectionId}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={info.mode === 'foundational' ? 'secondary' : 'default'}>
                      {info.mode}
                    </Badge>
                    <Badge variant="outline">
                      {info.insights.final} insights
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Policy */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Policy</h4>
                  <div className="flex gap-2 text-xs">
                    <Badge variant={info.policy.allowSkills ? 'default' : 'secondary'}>
                      Skills: {info.policy.allowSkills ? 'ON' : 'OFF'}
                    </Badge>
                    <Badge variant={info.policy.allowROI ? 'default' : 'secondary'}>
                      ROI: {info.policy.allowROI ? 'ON' : 'OFF'}
                    </Badge>
                    <Badge variant="outline">
                      {info.policy.allowedServiceIds.length} services
                    </Badge>
                  </div>
                </div>

                {/* Insights Flow */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Insights Flow</h4>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline">Gen: {info.insights.generated}</Badge>
                    <Badge variant="outline">Filtered: {info.insights.clientFiltered}</Badge>
                    <Badge variant="default">Final: {info.insights.final}</Badge>
                    {info.insights.generated > 0 && (
                      <Badge variant="secondary">
                        {((info.insights.final / info.insights.generated) * 100).toFixed(1)}% efficiency
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Sources */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Sources</h4>
                  <div className="flex gap-2 text-xs">
                    {Object.entries(info.sources).map(([source, count]) => 
                      count > 0 ? (
                        <Badge key={source} variant="outline">
                          {source}: {count}
                        </Badge>
                      ) : null
                    )}
                  </div>
                </div>

                {/* Performance */}
                <div>
                  <h4 className="text-sm font-medium mb-1">Performance</h4>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline">
                      Server: {info.performance.serverResponseMs}ms
                    </Badge>
                    <Badge variant="outline">
                      Client: {info.performance.clientProcessingMs}ms
                    </Badge>
                    <Badge variant="default">
                      Total: {info.performance.totalMs}ms
                    </Badge>
                    {info.performance.totalMs > 0 && info.insights.final > 0 && (
                      <Badge variant="secondary">
                        {(info.insights.final / (info.performance.totalMs / 1000)).toFixed(2)} insights/sec
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Blocked Insights */}
                {info.blocked.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1 text-destructive">
                      Blocked Insights ({info.blocked.length})
                    </h4>
                    <div className="space-y-1">
                      {info.blocked.map((blocked, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          <span className="font-medium">{blocked.title}</span>
                          {blocked.skillId && <span className="text-primary"> ({blocked.skillId})</span>}
                          <span className="text-destructive"> - {blocked.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}