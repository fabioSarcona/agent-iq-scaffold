import { Button } from '@/components/ui/button';
import { Terminal } from 'lucide-react';
import { useAuditProgressStore } from './AuditProgressStore';

export function LogsToggle() {
  const { logsEnabled, toggleLogs } = useAuditProgressStore();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLogs}
      className={`fixed bottom-4 right-4 z-50 ${logsEnabled ? 'bg-primary text-primary-foreground' : ''}`}
    >
      <Terminal className="w-4 h-4 mr-2" />
      {logsEnabled ? 'Logs ON' : 'Logs OFF'}
    </Button>
  );
}