import { z } from "./zod.ts";

export type NormalizedError = {
  name: string;
  message: string;
  code?: string;
  stack?: string;
  zodIssues?: z.ZodIssue[];
};

export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof z.ZodError) {
    return {
      name: "ZodError",
      message: "Validation failed",
      zodIssues: err.issues,
      stack: err.stack,
    };
  }
  if (err instanceof Error) {
    // molti SDK mettono `code` su Error come proprietà opzionale
    const anyErr = err as Error & { code?: string };
    return {
      name: err.name,
      message: err.message,
      code: anyErr.code,
      stack: err.stack,
    };
  }
  // fallback per stringhe/oggetti lanciati
  try {
    return { name: "NonErrorThrow", message: JSON.stringify(err) };
  } catch {
    return { name: "NonErrorThrow", message: String(err) };
  }
}

// shortcut quando vuoi solo il messaggio
export const errorMessage = (e: unknown) => normalizeError(e).message;