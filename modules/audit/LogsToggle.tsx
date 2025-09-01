import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Terminal, Clock } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useAuditProgressStore } from './AuditProgressStore';

export function LogsToggle() {
  const { logsEnabled, toggleLogs } = useAuditProgressStore();
  const [isOpen, setIsOpen] = useState(false);
  const events = logger.getEvents();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`fixed bottom-4 right-4 z-50 ${logsEnabled ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Terminal className="w-4 h-4 mr-2" />
          Events ({events.length})
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Debug Events</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2 max-h-[80vh] overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm">No events recorded yet.</p>
          ) : (
            events.slice().reverse().map((event, index) => (
              <div key={index} className="border rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="font-medium">{event.name}</div>
                {event.data && (
                  <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLogs}
            className={logsEnabled ? 'bg-primary text-primary-foreground' : ''}
          >
            <Terminal className="w-4 h-4 mr-2" />
            {logsEnabled ? 'Logs ON' : 'Logs OFF'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}