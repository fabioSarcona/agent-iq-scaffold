import dental from './config.dental.json';
import hvac from './config.hvac.json';
import type { AuditConfig, Vertical } from './types';

export function loadAuditConfig(vertical: Vertical): AuditConfig { 
  return vertical === 'dental' ? (dental as AuditConfig) : (hvac as AuditConfig); 
}