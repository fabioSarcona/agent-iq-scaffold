import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { LogEntry, EventCategory, TabConfig } from './types';

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
      filter: (event) => event.name.includes('iq_request') || event.name.includes('ai_request') || event.name.includes('insight')
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