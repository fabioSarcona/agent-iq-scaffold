// NeedAgentIQ™ model configuration (server-only)

export const NEEDAGENTIQ_MODEL = "claude-3.7-sonnet" as const;

export const NEEDAGENTIQ_PARAMS = {
  temperature: 0.2,
  maxTokens: 1200,
  retry: {
    attempts: 2,
    backoffMs: 300
  }
} as const;

export const NEEDAGENTIQ_SYSTEM_PROMPT = ""; // <-- will be injected later via a separate prompt

export const NEEDAGENTIQ_TIMEOUT_MS = 1200;