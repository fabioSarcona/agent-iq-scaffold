interface AuditLogEvent {
  type: 'question_view' | 'answer_submit' | 'validation_error' | 'back_click' | 'restart' | 'step_transition'
  questionId?: string
  questionIndex?: number
  answer?: string | number
  error?: string
  timestamp: Date
  industry?: 'dental' | 'hvac'
}

class AuditLogger {
  private isEnabled = false
  private logs: AuditLogEvent[] = []

  toggle() {
    this.isEnabled = !this.isEnabled
    console.log(`Audit logging ${this.isEnabled ? 'enabled' : 'disabled'}`)
  }

  log(event: Omit<AuditLogEvent, 'timestamp'>) {
    const logEvent = {
      ...event,
      timestamp: new Date()
    }
    
    this.logs.push(logEvent)
    
    if (this.isEnabled) {
      console.log(`[AUDIT LOG] ${event.type}:`, logEvent)
    }
  }

  getLogs() {
    return this.logs
  }

  clearLogs() {
    this.logs = []
    console.log('[AUDIT LOG] Logs cleared')
  }

  isLoggingEnabled() {
    return this.isEnabled
  }
}

export const auditLogger = new AuditLogger()