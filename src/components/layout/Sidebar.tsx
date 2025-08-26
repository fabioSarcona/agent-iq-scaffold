import { Settings, PanelLeft } from 'lucide-react'

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-sidebar/30 backdrop-blur-sm flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-2 text-sidebar-foreground">
          <PanelLeft className="h-5 w-5" />
          <span className="font-medium">NeedAgentIQ™ Panel</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">(coming soon)</p>
      </div>
      
      <div className="flex-1 p-6">
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 text-center">
            <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Advanced analytics and insights will appear here
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}