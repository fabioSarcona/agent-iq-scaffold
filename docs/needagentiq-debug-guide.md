# NeedAgentIQ Debug Guide

## Overview
Il sistema NeedAgentIQ Debug è stato implementato come parte della **FASE 7** del piano per fornire visibilità completa sul funzionamento del sistema di insights AI.

## Componenti

### 1. NeedAgentIQDebugger
**Posizione**: `modules/audit/NeedAgentIQDebugger.ts`

Sistema di logging avanzato che traccia:
- **Session Policy**: Modalità (foundational/skills) e permessi per sezione
- **Insights Flow**: Generazione → Filtri server → Filtri client → Output finale  
- **Performance Metrics**: Tempi di risposta server e processing client
- **Sources**: Mapping deterministico vs AI enhancement vs KB fallback
- **Blocked Insights**: Insight filtrati con ragioni specifiche

### 2. NeedAgentIQDebugPanel  
**Posizione**: `modules/audit/NeedAgentIQDebugPanel.tsx`

UI component integrato nel DevConsole con:
- **Real-time Monitoring**: Auto-refresh delle debug sessions
- **Demo Mode**: Pulsante per creare dati di test (solo dev)
- **Visual Metrics**: Badge colorati per policy, performance, efficiency
- **Console Integration**: Pulsante per generare summary completa

### 3. DevConsole Integration
**Posizione**: `modules/logger/DevConsolePanel.tsx`

Nuovo tab "NeedAgentIQ Debug" nel DevConsole con accesso diretto al debug panel.

## Architettura Section-Based

### Sezioni 1-2: Foundational Mode
```typescript
policy: {
  allowSkills: false,    // ❌ Nessun skill operativo
  allowROI: false,       // ❌ Nessun ROI calcolato
  allowedServiceIds: ['appointment_booking'] // Solo servizi base
}
```

### Sezioni 3-7: Skills Mode  
```typescript
policy: {
  allowSkills: true,     // ✅ Skills operativi
  allowROI: true,        // ✅ ROI calcolato
  allowedServiceIds: [   // Servizi completi
    'appointment_booking', 'lead_qualification', 
    'emergency_routing', 'payment_processing'
  ]
}
```

## Filtri di Sicurezza

### Server-Side (Edge Function)
- **ALLOWED_BY_SECTION**: Policy per ogni sezione
- **Mode Detection**: `foundational` vs `skills` 
- **Prompt Adaptation**: Claude riceve istruzioni specifiche
- **Pre-return Filter**: Insight filtrati prima della risposta

### Client-Side (AuditEngine)
- **CLIENT_SECTION_POLICY**: Mirror delle policy server
- **Double Security**: Controllo aggiuntivo prima dell'append al store
- **Detailed Logging**: Tracciamento insight bloccati

## API Debug

### Browser Console
```javascript
// Accesso diretto al debugger
NeedAgentIQDebugger.generateSummary('section_3')
NeedAgentIQDebugger.getAllSessions()

// Crea sessione demo per test
createDemoNeedAgentIQSession()
```

### Programmático 
```typescript
import { NeedAgentIQDebugger, createDemoSession } from '@modules/audit'

// Start session tracking
NeedAgentIQDebugger.startSession(sectionId, mode, policy)

// Log server response  
NeedAgentIQDebugger.logServerResponse(sectionId, insights, responseTimeMs)

// Log client filtering
NeedAgentIQDebugger.logClientFilter(sectionId, preCount, postCount, blocked)

// Complete session
NeedAgentIQDebugger.completeSession(sectionId, totalTimeMs)
```

## Metriche Monitorate

### Insights Flow
- **Generated**: Numero insight generati dal server
- **Server Filtered**: Insight bloccati da policy server
- **Client Filtered**: Insight bloccati da policy client  
- **Final**: Insight effettivamente mostrati all'utente
- **Efficiency**: Percentuale (Final/Generated * 100)

### Performance
- **Server Response**: Tempo risposta Edge Function
- **Client Processing**: Tempo elaborazione client-side
- **Total Time**: Tempo end-to-end completo
- **Throughput**: Insights processati per secondo

### Sources Distribution
- **mapping**: Insights da voice skill mapping deterministico
- **ai-enhanced**: Insights da Claude enhancement
- **kb-fallback**: Insights da knowledge base fallback
- **foundational**: Insights foundational per sezioni 1-2

## Troubleshooting

### Insight Non Visibili
1. Controllare badge count vs panel content nel DevConsole
2. Verificare policy della sezione attuale
3. Controllare insight bloccati nella sezione "Blocked Insights"
4. Usare `NeedAgentIQDebugger.generateSummary()` per dettagli

### Performance Issues
1. Monitorare Server Response Time (target: <2000ms)
2. Verificare Client Processing Time (target: <500ms)  
3. Controllare Efficiency ratio (target: >80%)
4. Identificare colli di bottiglia nei logs

### Policy Violations
1. Verificare alignment CLIENT_SECTION_POLICY vs ALLOWED_BY_SECTION
2. Controllare skill.id contro allowedServiceIds
3. Verificare monthlyImpactUsd vs allowROI policy
4. Validare mode detection logic

## Integration Points

### Con AuditProgressStore
- Hook: `appendInsights()` con pre-filtering
- State: `insightsBySection` preservation fix
- Logging: Store mutations tracked

### Con Edge Function  
- Input: `sectionId` per mode detection
- Processing: Policy-aware insight generation
- Output: Filtered insights con source tracking

### Con DevConsole
- UI: Dedicated debug tab 
- Real-time: Auto-refresh sessions
- Export: Console summary generation

## Development Helpers

### Demo Data
Pulsante "Create Demo" genera:
- Sessione `section_3_demo` con 3 insight simulati
- Performance metrics realistici  
- Policy compliance per testing

### Console Integration
```javascript
// Global access in dev mode
window.NeedAgentIQDebugger
window.createDemoNeedAgentIQSession
```

### Auto-cleanup
- Session data cleared on page reload
- Memory management per large audits
- Dev mode safety checks

---

**Nota**: Questo sistema è attivo solo in modalità sviluppo. In produzione, il logging è minimizzato per performance.