import { useEffect } from 'react'
import { useAuditProgressStore } from '@/stores/auditProgressStore'
import { RegistrationEngine } from '../../modules/registration/RegistrationEngine'

export default function AuditHVAC() {
  const { setIndustry } = useAuditProgressStore()

  useEffect(() => {
    setIndustry('hvac')
  }, [setIndustry])

  return <RegistrationEngine industry="hvac" />
}