import { useEffect } from 'react'
import { useAuditProgressStore } from '../../modules/audit/AuditProgressStore'
import { AuditEngine } from '../../modules/audit/AuditEngine'

export default function AuditDental() {
  const { setVertical } = useAuditProgressStore()

  useEffect(() => {
    setVertical('dental')
  }, [setVertical])

  return <AuditEngine industry="dental" />
}