# Shared Edge Function Modules

This directory contains shared utilities and types for Supabase Edge Functions, designed to eliminate code duplication and ensure consistency across all functions.

## Architecture

- **Deno Isolation**: All modules are self-contained and Deno-compatible
- **No Cross-Imports**: Edge functions MUST NOT import from `src/` or `modules/` directories
- **URL Modules Only**: External dependencies use Deno URL imports (e.g., `https://esm.sh/`)

## Modules

### `env.ts`
Centralized environment variable handling with validation:
```typescript
import { getEnv } from '../_shared/env.ts';
const env = getEnv(); // Returns typed, validated environment variables
```

### `logger.ts`
Structured logging with PII redaction:
```typescript
import { logger } from '../_shared/logger.ts';
logger.info('Processing request', { auditId: 'safe-id' });
logger.error('Operation failed', { error: err.message });
```

### `validation.ts`
Zod schemas for all edge function inputs/outputs:
```typescript
import { VoiceFitInputSchema } from '../_shared/validation.ts';
const validatedInput = VoiceFitInputSchema.parse(body);
```

### `kb.ts`
Knowledge base validation and access helpers:
```typescript
import { validateKBSlice } from '../_shared/kb.ts';
const kb = validateKBSlice(inputKB);
```

### `types.ts`
Shared TypeScript types inferred from validation schemas:
```typescript
import type { VoiceFitInput, SkillScopeOutput } from '../_shared/types.ts';
```

## Extension Guidelines

1. **Adding New Schemas**: Add to `validation.ts` and export corresponding types in `types.ts`
2. **Environment Variables**: Add to the `EnvConfig` interface in `env.ts`
3. **Logging**: Use structured logging from `logger.ts` instead of direct `console.log`
4. **Error Handling**: Use the standardized error response helpers

## Contract

- All edge functions import ONLY from `_shared/` and URL modules
- No dependencies on the React application codebase
- KB data comes exclusively from request payloads, not file system reads
- All schemas are self-contained within this shared module