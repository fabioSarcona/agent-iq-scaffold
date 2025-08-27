import { z } from 'zod';

export const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
export const phoneE164Rx = /^\+?[1-9]\d{6,14}$/;
export const currencyNumber = z.preprocess(
  v => typeof v === 'string' ? Number(v.replace(/[^\d.-]/g,'')) : v, 
  z.number().min(0).max(1_000_000)
);
export const intRange = (min: number, max: number) => z.number().int().min(min).max(max);