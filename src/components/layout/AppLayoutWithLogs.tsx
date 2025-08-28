import { AppLayout } from './AppLayout'
import { LogsToggle } from '@modules/audit'

export function AppLayoutWithLogs() {
  return (
    <>
      <AppLayout />
      <LogsToggle />
    </>
  )
}