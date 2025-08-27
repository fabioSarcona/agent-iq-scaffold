// Deno runtime (Supabase Functions)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type Vertical = 'dental' | 'hvac';

interface RecoverableRange { min: number; max: number }
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface LossArea {
  key: string; title: string;
  dailyUsd: number; monthlyUsd: number; annualUsd: number;
  severity: Severity; recoverablePctRange: RecoverableRange; rationale: string[];
}
interface MoneyLostSummary {
  vertical: Vertical;
  dailyTotalUsd: number; monthlyTotalUsd: number; annualTotalUsd: number;
  areas: LossArea[]; assumptions: string[]; version: string;
}

// Lightweight zod-like input check
function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' }});
  }
  try {
    const body = await req.json();
    if (!isRecord(body) || (body.vertical !== 'dental' && body.vertical !== 'hvac') || !isRecord(body.answers)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    // Import server math from bundled code or inline minimal compute (for now we inline a safe proxy):
    // NOTE: Keep conservative fallback to avoid inflating numbers.
    const { vertical, answers } = body as { vertical: Vertical; answers: Record<string, unknown> };

    // Minimal proxy to your existing math — NOTE: if you have server math in repo, mirror logic here or keep conservative placeholder.
    // For now, return a minimal well-structured object to unblock the client. Replace later with real math port if needed.
    const summary: MoneyLostSummary = {
      vertical,
      dailyTotalUsd: 0,
      monthlyTotalUsd: 0,
      annualTotalUsd: 0,
      areas: [],
      assumptions: ['Edge function placeholder – wire to real compute soon'],
      version: 'ml-edge-v1'
    };

    return new Response(JSON.stringify(summary), { status: 200, headers: { 'Content-Type': 'application/json' }});
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
  }
});
