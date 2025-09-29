import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Trash2, Search, Activity, DollarSign, AlertTriangle, Settings, RotateCcw, Brain } from 'lucide-react';
import { useLogEvents, useEventFilter, useAutoRefresh, useIQErrors } from './hooks';
import { EventCategory, LogEntry } from './types';
import { cn } from '@/lib/utils';
import { NeedAgentIQDebugPanel } from '../audit/NeedAgentIQDebugPanel';

const EventCard = ({ event, index }: { event: LogEntry; index: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const time = new Date(event.timestamp).toLocaleTimeString();
  
  const getLevelBadge = (level: string = 'info', name: string) => {
    if (level === 'error' || name.includes('error') || name.includes('fail')) {
      return <Badge variant="destructive" className="text-xs">ERROR</Badge>;
    }
    if (name.includes('success') || name.includes('complete')) {
      return <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">SUCCESS</Badge>;
    }
    if (name.includes('request') || name.includes('ai_')) {
      return <Badge className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">REQUEST</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">INFO</Badge>;
  };

  return (
    <Card className="glass-card border border-border/30 hover-lift transition-all duration-300">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono">{time}</span>
            {getLevelBadge(event.level, event.name)}
          </div>
          <span className="text-xs text-muted-foreground">#{index + 1}</span>
        </div>
        <CardTitle className="text-sm font-medium">{event.name}</CardTitle>
      </CardHeader>
      
      {isExpanded && event.data && (
        <CardContent className="pt-0">
          <Separator className="mb-3" />
          <div className="glass-card rounded-md p-3 bg-muted/20">
            <pre className="text-xs overflow-x-auto text-foreground/80 font-mono whitespace-pre-wrap">
              {JSON.stringify(event.data, null, 2)}
            </pre>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const TabIcon = ({ category }: { category: EventCategory }) => {
  const icons = {
    insights: Activity,
    moneylost: DollarSign,
    errors: AlertTriangle,
    system: Settings,
    needagentiq: Brain
  };
  const Icon = icons[category as keyof typeof icons];
  return Icon ? <Icon className="h-4 w-4" /> : null;
};

export function DevConsolePanel() {
  const [selectedTab, setSelectedTab] = useState<EventCategory>('insights');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { isEnabled: autoRefresh, toggle: toggleAutoRefresh } = useAutoRefresh();
  const { events, refreshEvents, clearEvents } = useLogEvents(autoRefresh);
  const { filteredEvents, eventCounts, tabConfigs } = useEventFilter(events, selectedTab, searchQuery);
  const { sectionsWithErrors, retrySection, hasErrors } = useIQErrors();

  // Add NeedAgentIQ Debug tab
  const allTabs = [
    ...tabConfigs,
    {
      id: 'needagentiq' as EventCategory,
      label: 'NeedAgentIQ Debug',
      description: 'Advanced debugging for NeedAgentIQ insights generation'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Developer Console
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitor system events, AI requests, and application logs in real-time
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 glass-card px-3 py-2 rounded-md border border-border/30">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={toggleAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-xs">Auto Refresh</Label>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshEvents}
            className="gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearEvents}
            className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* IQ Errors Panel - Only show if there are errors */}
      {hasErrors && (
        <Card className="glass-card border border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              NeedAgentIQ Section Errors
              <Badge variant="destructive" className="ml-auto">
                {sectionsWithErrors.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Sections with failed AI insight generation. Click retry to attempt again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sectionsWithErrors.map(({ sectionId, error, sectionName }) => (
                <div key={sectionId} className="flex items-center justify-between p-3 bg-background/50 rounded-md border border-destructive/10">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{sectionName}</div>
                    <div className="text-xs text-destructive/80 mt-1">{String(error)}</div>
                    <div className="text-xs text-muted-foreground mt-1">Section ID: {sectionId}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retrySection(sectionId)}
                    className="gap-2 ml-3"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Retry
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as EventCategory)}>
        <TabsList className="grid w-full grid-cols-5 glass-card border border-border/30">
          {allTabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="relative gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <TabIcon category={tab.id} />
              {tab.label}
              {tab.id !== 'needagentiq' && eventCounts[tab.id as keyof typeof eventCounts] > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center",
                    tab.id === 'errors' && eventCounts[tab.id] > 0 && "bg-destructive/20 text-destructive"
                  )}
                >
                  {eventCounts[tab.id]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {allTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {tab.id === 'needagentiq' ? (
              <NeedAgentIQDebugPanel />
            ) : (
            <Card className="glass-card border border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TabIcon category={tab.id} />
                  {tab.label}
                  <Badge variant="outline" className="ml-auto">
                    {selectedTab === tab.id ? filteredEvents.length : eventCounts[tab.id]} events
                  </Badge>
                </CardTitle>
                <CardDescription>{tab.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No {tab.label.toLowerCase()} events found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredEvents.map((event, index) => (
                        <EventCard key={`${event.timestamp}-${index}`} event={event} index={index} />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}