export const defaultLocale = 'en-US' as const;
export function formatCurrencyUSD(n: number) {
  return new Intl.NumberFormat(defaultLocale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
export function formatPercent(p: number) {
  return new Intl.NumberFormat(defaultLocale, { style: 'percent', maximumFractionDigits: 0 }).format(p);
}