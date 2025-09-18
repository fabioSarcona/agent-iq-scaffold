import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'
// import { LanguageSwitcher } from './LanguageSwitcher' // Temporarily hidden for monolingual mode
import { useTranslation } from '@/hooks/useTranslation'

export function TopBar() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <header className="h-16 glass-nav sticky top-0 z-50 px-6 flex items-center justify-between animate-fade-in-scale">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl md:text-2xl font-bold bg-gradient-glow bg-clip-text text-transparent animate-shimmer">
          {t('app.title')}
        </h1>
      </div>

      <div className="flex items-center space-x-2">
        {/* <LanguageSwitcher /> */} {/* Temporarily hidden for monolingual mode */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="hover-lift"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  )
}