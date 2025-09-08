import { AppLayout } from './AppLayout'
import { LogsToggle } from '@modules/audit'
import { useTranslation } from '@/hooks/useTranslation'

export function AppLayoutWithLogs() {
  const { t } = useTranslation();
  
  return (
    <>
      <AppLayout />
      <LogsToggle />
      {/* Test translation integration */}
      <div className="sr-only" aria-hidden="true">{t('app.title')}</div>
    </>
  )
}