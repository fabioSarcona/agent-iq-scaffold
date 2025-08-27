import { useEffect } from 'react'
import { useAuditProgressStore, AuditEngine } from '../../modules/audit'

export default function AuditDental() {
  const { setVertical } = useAuditProgressStore()

  useEffect(() => {
    setVertical('dental')
  }, [setVertical])

  return <AuditEngine industry="dental" />
}