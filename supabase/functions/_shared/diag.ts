// supabase/functions/_shared/diag.ts
// Helper condivisi per Diagnostics Mode & Health

export const isDiagMode = () => {
  try {
    const flag = Deno.env.get('DIAG_MODE') || Deno.env.get('NEXT_PUBLIC_DIAG_MODE');
    return (flag || '').toLowerCase() === 'true';
  } catch {
    return false;
  }
};

export type KBPresence = {
  approved_claims?: boolean;
  services?: boolean;
  roi_brain_kb?: boolean;
};

export const diagWrap = <T extends Record<string, unknown>>(payload: T, debug?: Record<string, unknown>) => {
  if (!isDiagMode()) return payload as T;
  return Object.assign({}, payload, { _debug: debug || {} }) as T & { _debug: Record<string, unknown> };
};