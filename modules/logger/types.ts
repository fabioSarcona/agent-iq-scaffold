export interface LogEntry {
  timestamp: string;
  name: string;
  data?: Record<string, unknown>;
  level?: 'info' | 'warn' | 'error' | 'debug';
}

export interface EventFilter {
  category: EventCategory;
  level?: LogEntry['level'];
  search?: string;
}

export type EventCategory = 'insights' | 'moneylost' | 'errors' | 'system' | 'all';

export interface TabConfig {
  id: EventCategory;
  label: string;
  description: string;
  icon?: string;
  filter: (event: LogEntry) => boolean;
}

export interface DevConsoleState {
  autoRefresh: boolean;
  selectedTab: EventCategory;
  searchQuery: string;
}