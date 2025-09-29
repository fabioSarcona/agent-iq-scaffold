import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { LogEntry, EventCategory, TabConfig } from './types';
import { useAuditProgressStore } from '@modules/audit/AuditProgressStore';
import { supabase } from '@/integrations/supabase/client';

export const useLogEvents = (autoRefresh = false) => {
  const [events, setEvents] = useState<LogEntry[]>([]);

  const refreshEvents = useCallback(() => {
    const currentEvents = logger.getEvents();
    setEvents([...currentEvents].reverse()); // Most recent first
  }, []);

  useEffect(() => {
    refreshEvents();
    
    if (autoRefresh) {
      const interval = setInterval(refreshEvents, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshEvents]);

  const clearEvents = useCallback(() => {
    // Clear the ring buffer by getting all events and removing them
    logger.getEvents().length = 0;
    setEvents([]);
  }, []);

  return { events, refreshEvents, clearEvents };
};

export const useEventFilter = (events: LogEntry[], category: EventCategory, searchQuery = '') => {
  const tabConfigs: TabConfig[] = useMemo(() => [
    {
      id: 'insights',
      label: 'AI Insights',
      description: 'AI system requests and responses',
      filter: (event) => event.name.includes('iq_request') || event.name.includes('needagentiq') || event.name.includes('ai_request') || event.name.includes('insight')
    },
    {
      id: 'moneylost', 
      label: 'MoneyLost',
      description: 'Money lost calculations and analysis',
      filter: (event) => event.name.includes('moneylost')
    },
    {
      id: 'errors',
      label: 'Errors',
      description: 'Error events and exceptions',
      filter: (event) => event.level === 'error' || event.name.includes('error') || event.name.includes('fail')
    },
    {
      id: 'system',
      label: 'System',
      description: 'Audit completion, section progress, and system events',
      filter: (event) => event.name.includes('section_complete') || event.name.includes('audit') || event.name.includes('registration') || event.name.includes('otp')
    }
  ], []);

  const filteredEvents = useMemo(() => {
    const config = tabConfigs.find(t => t.id === category);
    let filtered = category === 'all' ? events : events.filter(config?.filter || (() => true));
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(query) ||
        JSON.stringify(event.data || {}).toLowerCase().includes(query)
      );
    }
    
    return filtered.slice(0, 50); // Max 50 events
  }, [events, category, searchQuery, tabConfigs]);

  const eventCounts = useMemo(() => {
    const counts: Record<EventCategory, number> = { insights: 0, moneylost: 0, errors: 0, system: 0, all: events.length };
    
    tabConfigs.forEach(config => {
      counts[config.id] = events.filter(config.filter).length;
    });
    
    return counts;
  }, [events, tabConfigs]);

  return { filteredEvents, eventCounts, tabConfigs };
};

export const useAutoRefresh = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  
  const toggle = useCallback(() => setIsEnabled(prev => !prev), []);
  
  return { isEnabled, toggle };
};

export const useIQErrors = () => {
  const iqErrorBySection = useAuditProgressStore(state => state.iqErrorBySection);
  const { appendInsights, setIqError, vertical, config } = useAuditProgressStore();
  
  const sectionsWithErrors = useMemo(() => {
    return Object.entries(iqErrorBySection)
      .filter(([_, error]) => error !== null)
      .map(([sectionId, error]) => ({
        sectionId,
        error,
        sectionName: config?.sections.find(s => s.id === sectionId)?.headline || sectionId
      }));
  }, [iqErrorBySection, config]);

  const retrySection = useCallback(async (sectionId: string) => {
    if (!config) return;
    
    const section = config.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const { answers } = useAuditProgressStore.getState();
    
    // Get answers for this section only
    const sectionAnswers = section.questions.reduce((acc, question) => {
      const answer = answers[question.id];
      if (answer !== undefined && answer !== null && answer !== '') {
        acc[question.id] = answer;
      }
      return acc;
    }, {} as Record<string, unknown>);
    
    const meaningfulCount = Object.keys(sectionAnswers).length;
    if (meaningfulCount < 3) {
      logger.event('needagentiq_retry_skip', { 
        sectionId, 
        meaningfulCount,
        reason: 'insufficient_answers'
      });
      return;
    }
    
    try {
      // Clear existing error first
      setIqError(sectionId, null);
      
      logger.event('needagentiq_retry_start', { sectionId, meaningfulCount });
      
      const { data, error } = await supabase.functions.invoke('ai_needagentiq', {
        body: {
          vertical: vertical || 'dental',
          sectionId,
          answersSection: sectionAnswers
        }
      });
      
      if (error) throw new Error(error.message || 'NeedAgentIQ retry failed');
      
      if (Array.isArray(data) && data.length > 0) {
        const enrichedInsights = data.map(insight => ({
          ...insight,
          sectionId,
          key: insight.key || `section_${sectionId}_retry`
        }));
        
        appendInsights(sectionId, enrichedInsights);
        logger.event('needagentiq_retry_success', { 
          sectionId, 
          insights: data.length 
        });
      }
    } catch (error: any) {
      const errorMsg = error?.message?.slice(0, 160) || 'NeedAgentIQ retry failed';
      setIqError(sectionId, errorMsg);
      logger.error('needagentiq_retry_error', { 
        sectionId, 
        msg: errorMsg 
      });
    }
  }, [config, vertical, appendInsights, setIqError]);

  return {
    sectionsWithErrors,
    retrySection,
    hasErrors: sectionsWithErrors.length > 0
  };
};