type Level = 'debug' | 'info' | 'warn' | 'error';
const redact = (data: any) => {
  if (!data || typeof data !== 'object') return data;
  const clone = { ...data };
  ['email', 'phone', 'firstName', 'lastName'].forEach(k => { if (k in clone) clone[k] = '[REDACTED]'; });
  return clone;
};
const log = (level: Level, msg: string, data?: any) => {
  const payload = data ? redact(data) : undefined;
  // Replace with Sentry/Logflare later
  // eslint-disable-next-line no-console
  console[level](`[${level.toUpperCase()}] ${msg}`, payload ?? '');
};
export const logger = {
  debug: (m: string, d?: any) => log('debug', m, d),
  info:  (m: string, d?: any) => log('info',  m, d),
  warn:  (m: string, d?: any) => log('warn',  m, d),
  error: (m: string, d?: any) => log('error', m, d),
};