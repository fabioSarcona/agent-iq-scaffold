import { useEffect } from 'react'
import { useAuditProgressStore, AuditEngine } from '../../modules/audit'

export default function AuditHVAC() {
  const { setVertical } = useAuditProgressStore()

  useEffect(() => {
    setVertical('hvac')
  }, [setVertical])

  return <AuditEngine industry="hvac" />
}