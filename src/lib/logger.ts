type Level = 'debug' | 'info' | 'warn' | 'error';
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
export const logger = {
  debug: (message: string, data?: unknown) => log('debug', message, data),
  info:  (message: string, data?: unknown) => log('info',  message, data),
  warn:  (message: string, data?: unknown) => log('warn',  message, data),
  error: (message: string, data?: unknown) => log('error', message, data),
};