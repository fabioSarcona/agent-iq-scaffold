type Level = 'debug' | 'info' | 'warn' | 'error';

interface EventEntry {
  timestamp: string;
  name: string;
  data?: Record<string, unknown>;
}

// Ring buffer for events (max 50 items)
const eventRingBuffer: EventEntry[] = [];
const MAX_EVENTS = 50;

const redact = (data: unknown): unknown => {
  if (!data || typeof data !== 'object') return data;
  const clone: Record<string, unknown> = { ...data as Record<string, unknown> };
  ['email', 'phone', 'firstName', 'lastName'].forEach(k => { if (k in clone) clone[k] = '[REDACTED]'; });
  return clone;
};

const log = (level: Level, message: string, data?: unknown) => {
  const payload = data === undefined ? undefined : redact(data);
  // Replace with Sentry/Logflare later
  // eslint-disable-next-line no-console
  console[level](`[${level.toUpperCase()}] ${message}`, payload ?? '');
};

const addEvent = (name: string, data?: Record<string, unknown>) => {
  const event: EventEntry = {
    timestamp: new Date().toISOString(),
    name,
    data: data ? redact(data) as Record<string, unknown> : undefined
  };
  
  eventRingBuffer.push(event);
  if (eventRingBuffer.length > MAX_EVENTS) {
    eventRingBuffer.shift();
  }
};

export const logger = {
  debug: (message: string, data?: unknown) => log('debug', message, data),
  info:  (message: string, data?: unknown) => log('info',  message, data),
  warn:  (message: string, data?: unknown) => log('warn',  message, data),
  error: (message: string, data?: unknown) => log('error', message, data),
  event: (name: string, data?: Record<string, unknown>) => addEvent(name, data),
  getEvents: () => [...eventRingBuffer]
};