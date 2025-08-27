import { useEffect } from 'react'
import { useAuditProgressStore } from '../../modules/audit/AuditProgressStore'
import { AuditEngine } from '../../modules/audit/AuditEngine'

export default function AuditHVAC() {
  const { setVertical } = useAuditProgressStore()

  useEffect(() => {
    setVertical('hvac')
  }, [setVertical])

  return <AuditEngine industry="hvac" />
}