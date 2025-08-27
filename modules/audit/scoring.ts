import type { AuditConfig, ScoreSummary, AuditQuestion } from './types';

export function scoreQuestion(q: AuditQuestion, raw: unknown): number {
  if (!q.scoring) return 0;
  
  if (q.scoring.kind === 'options') {
    const opt = q.options?.find(o => o.value === String(raw));
    const v = typeof opt?.score === 'number' ? opt.score : 0;
    return Math.max(0, Math.min(100, Math.round((v / q.scoring.max) * 100)));
  }
  
  if (q.scoring.kind === 'range') {
    const n = typeof raw === 'number' ? raw : Number(raw); 
    if (!Number.isFinite(n)) return 0;
    const { mode, min, max } = q.scoring; 
    const c = Math.max(min, Math.min(max, n)); 
    const pct = (c - min) / Math.max(1, max - min);
    return Math.round((mode === 'higher-is-better' ? pct : 1 - pct) * 100);
  }
  
  return 0;
}

export function computeScores(cfg: AuditConfig, answers: Record<string, unknown>): ScoreSummary {
  const sections = cfg.sections.map(sec => {
    const vals = sec.questions.map(q => scoreQuestion(q, answers[q.id]));
    const avg = vals.length ? Math.round(vals.reduce((s, n) => s + n, 0) / vals.length) : 0;
    return { sectionId: sec.id, score: avg };
  });
  
  const overall = sections.length ? Math.round(sections.reduce((s, x) => s + x.score, 0) / sections.length) : 0;
  return { overall, sections };
}