// Structured logging with PII redaction for Edge Functions

// PII fields to redact from logs
const PII_FIELDS = new Set([
  'email', 'phone', 'firstName', 'lastName', 'fullName', 
  'address', 'ssn', 'dob', 'birthDate', 'phoneNumber'
]);

/**
 * Redact PII from an object
 */
function redactPII(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Simple email detection
    if (obj.includes('@') && obj.includes('.')) {
      return '[REDACTED_EMAIL]';
    }
    // Simple phone number detection (contains digits and common phone chars)
    if (/^[\d\s\-\+\(\)\.]{10,}$/.test(obj)) {
      return '[REDACTED_PHONE]';
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(redactPII);
  }
  
  if (typeof obj === 'object') {
    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (PII_FIELDS.has(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactPII(value);
      }
    }
    return redacted;
  }
  
  return obj;
}

/**
 * Format log message with timestamp and level
 */
function formatLog(level: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const logData = data ? redactPII(data) : undefined;
  
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...(logData && { data: logData })
  });
}

export const logger = {
  debug: (message: string, data?: any) => {
    console.log(formatLog('DEBUG', message, data));
  },
  
  info: (message: string, data?: any) => {
    console.log(formatLog('INFO', message, data));
  },
  
  warn: (message: string, data?: any) => {
    console.warn(formatLog('WARN', message, data));
  },
  
  error: (message: string, data?: any) => {
    console.error(formatLog('ERROR', message, data));
  }
};