import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { auditLogger } from '@/lib/auditLogger'
import { Terminal } from 'lucide-react'

export function LogsToggle() {
  const [isEnabled, setIsEnabled] = useState(auditLogger.isLoggingEnabled())

  const toggleLogs = () => {
    auditLogger.toggle()
    setIsEnabled(auditLogger.isLoggingEnabled())
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLogs}
      className={`fixed bottom-4 right-4 z-50 ${isEnabled ? 'bg-primary text-primary-foreground' : ''}`}
    >
      <Terminal className="w-4 h-4 mr-2" />
      {isEnabled ? 'Logs ON' : 'Logs OFF'}
    </Button>
  )
}