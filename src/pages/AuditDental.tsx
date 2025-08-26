import { useEffect } from 'react'
import { useAuditProgressStore } from '@/stores/auditProgressStore'
import { RegistrationEngine } from '../../modules/registration/RegistrationEngine'

export default function AuditDental() {
  const { setIndustry } = useAuditProgressStore()

  useEffect(() => {
    setIndustry('dental')
  }, [setIndustry])

  return <RegistrationEngine industry="dental" />
}