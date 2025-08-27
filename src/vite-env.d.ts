/// <reference types="vite/client" />

declare module '@modules/audit/AuditProgressStore' {
  export const useAuditProgressStore: any;
}

declare module '@modules/moneylost/components' {
  export const MoneyLostSummaryCard: any;
  export const LossAreaCard: any;
  export const DisclaimerNote: any;
}

declare module '@modules/moneylost/client' {
  export const requestMoneyLost: any;
}
