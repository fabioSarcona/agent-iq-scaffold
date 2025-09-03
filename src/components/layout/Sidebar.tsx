import { Settings, PanelLeft, Sparkles } from 'lucide-react'

export function Sidebar() {
  return (
    <aside className="w-64 glass-card border-r border-border/30 flex flex-col animate-fade-in-scale">
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center space-x-3 text-sidebar-foreground">
          <div className="p-2 rounded-lg bg-gradient-glow">
            <PanelLeft className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="font-semibold text-base">NeedAgentIQ™</span>
            <p className="text-xs text-muted-foreground mt-0.5">Analytics Panel</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-xl border border-dashed border-border/50 text-center hover-lift group">
            <div className="w-16 h-16 mx-auto mb-4 glass-card rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="h-8 w-8 text-brand-secondary animate-float" />
            </div>
            <h3 className="font-semibold text-sm mb-2">Advanced Analytics</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Real-time insights and business intelligence will appear here
            </p>
            <div className="mt-4 pt-4 border-t border-border/30">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-secondary/10 text-brand-secondary">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}