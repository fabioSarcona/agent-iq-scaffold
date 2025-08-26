import { AppLayout } from './AppLayout'
import { LogsToggle } from '../../../modules/audit/LogsToggle'

export function AppLayoutWithLogs() {
  return (
    <>
      <AppLayout />
      <LogsToggle />
    </>
  )
}