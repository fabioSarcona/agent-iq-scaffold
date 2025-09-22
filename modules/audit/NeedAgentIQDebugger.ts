// FASE 7: Advanced logging and debug utilities for NeedAgentIQ
export interface NeedAgentIQDebugInfo {
  sectionId: string;
  mode: 'foundational' | 'skills';
  policy: {
    allowSkills: boolean;
    allowROI: boolean;
    allowedServiceIds: string[];
  };
  insights: {
    generated: number;
    serverFiltered: number;
    clientFiltered: number;
    final: number;
  };
  sources: {
    mapping: number;
    aiEnhanced: number;
    kbFallback: number;
    foundational: number;
  };
  performance: {
    serverResponseMs: number;
    clientProcessingMs: number;
    totalMs: number;
  };
  blocked: Array<{
    title: string;
    reason: string;
    source: string;
    skillId?: string;
  }>;
}

// Debug store for development insights
const debugStore: Record<string, NeedAgentIQDebugInfo> = {};

export const NeedAgentIQDebugger = {
  // Start debugging session for a section
  startSession(sectionId: string, mode: string, policy: any): void {
    debugStore[sectionId] = {
      sectionId,
      mode: mode as 'foundational' | 'skills',
      policy,
      insights: { generated: 0, serverFiltered: 0, clientFiltered: 0, final: 0 },
      sources: { mapping: 0, aiEnhanced: 0, kbFallback: 0, foundational: 0 },
      performance: { serverResponseMs: 0, clientProcessingMs: 0, totalMs: 0 },
      blocked: []
    };
  },

  // Log server response
  logServerResponse(sectionId: string, insights: any[], responseTimeMs: number): void {
    if (debugStore[sectionId]) {
      debugStore[sectionId].insights.generated = insights.length;
      debugStore[sectionId].performance.serverResponseMs = responseTimeMs;
      
      // Count by source
      insights.forEach(insight => {
        const source = insight.source || 'unknown';
        if (source in debugStore[sectionId].sources) {
          debugStore[sectionId].sources[source as keyof typeof debugStore[sectionId].sources]++;
        }
      });
    }
  },

  // Log client filtering
  logClientFilter(sectionId: string, preFilter: number, postFilter: number, blocked: any[]): void {
    if (debugStore[sectionId]) {
      debugStore[sectionId].insights.clientFiltered = preFilter - postFilter;
      debugStore[sectionId].insights.final = postFilter;
      debugStore[sectionId].blocked = blocked.map(insight => ({
        title: insight.title || 'Unknown',
        reason: 'Client policy violation',
        source: insight.source || 'unknown',
        skillId: insight.skill?.id
      }));
    }
  },

  // Complete session
  completeSession(sectionId: string, totalTimeMs: number): void {
    if (debugStore[sectionId]) {
      debugStore[sectionId].performance.totalMs = totalTimeMs;
      debugStore[sectionId].performance.clientProcessingMs = 
        totalTimeMs - debugStore[sectionId].performance.serverResponseMs;
    }
  },

  // Get debug info for a section
  getSessionInfo(sectionId: string): NeedAgentIQDebugInfo | null {
    return debugStore[sectionId] || null;
  },

  // Get all debug sessions
  getAllSessions(): Record<string, NeedAgentIQDebugInfo> {
    return { ...debugStore };
  },

  // Clear debug data
  clearSessions(): void {
    Object.keys(debugStore).forEach(key => delete debugStore[key]);
  },

  // Generate debug summary for console
  generateSummary(sectionId?: string): void {
    const sessions = sectionId ? 
      { [sectionId]: debugStore[sectionId] } : 
      debugStore;

    console.group('🔍 NeedAgentIQ Debug Summary');
    
    Object.entries(sessions).forEach(([id, info]) => {
      if (!info) return;
      
      console.group(`📊 Section: ${id}`);
      console.log('Mode:', info.mode);
      console.log('Policy:', info.policy);
      console.log('Insights Flow:', {
        generated: info.insights.generated,
        clientFiltered: info.insights.clientFiltered,
        final: info.insights.final,
        filterEfficiency: `${((info.insights.final / info.insights.generated) * 100).toFixed(1)}%`
      });
      console.log('Sources:', info.sources);
      console.log('Performance:', {
        ...info.performance,
        efficiency: `${(info.insights.final / (info.performance.totalMs / 1000)).toFixed(2)} insights/sec`
      });
      if (info.blocked.length > 0) {
        console.warn('Blocked Insights:', info.blocked);
      }
      console.groupEnd();
    });
    
    console.groupEnd();
  }
};

// Auto-cleanup on page reload in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.addEventListener('beforeunload', () => {
    NeedAgentIQDebugger.clearSessions();
  });
}