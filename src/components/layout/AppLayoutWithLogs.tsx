import { AppLayout } from './AppLayout'
import { LogsToggle } from '@/components/audit/LogsToggle'

export function AppLayoutWithLogs() {
  return (
    <>
      <AppLayout />
      <LogsToggle />
    </>
  )
}