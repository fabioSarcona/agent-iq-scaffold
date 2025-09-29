// Cache System Module - L1 (In-Memory LRU) + L2 (Supabase) with SHA-256 keys
// Implements stampede protection, negative caching, and deterministic key generation

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  accessTime: number;
  hitCount: number;
}

interface CacheKeyParams {
  vertical: string;
  auditAnswers: unknown;
  moneyLost: unknown;
  kbVersion: string;
  promptVersion: string;
  model: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  locale?: string;
  kbFilterSignature?: string;
}

// L1 Cache Configuration
const MAX_SIZE = 200;
const TTL_MS = 10 * 60 * 1000; // 10 minutes
const NEGATIVE_CACHE_TTL_MS = 60 * 1000; // 1 minute for errors

/**
 * L1 In-Memory LRU Cache
 * Thread-safe for single-threaded Deno runtime
 */
class L1Cache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // TTL check
    if (Date.now() - entry.timestamp > TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access time and hit count for LRU
    entry.accessTime = Date.now();
    entry.hitCount++;
    
    // Move to end (most recently used) for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.data;
  }
  
  set(key: string, data: T, isNegative = false): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      accessTime: now,
      hitCount: 1
    };
    
    // For negative cache, use shorter TTL
    if (isNegative) {
      entry.timestamp = now - (TTL_MS - NEGATIVE_CACHE_TTL_MS);
    }
    
    this.cache.set(key, entry);
    
    // LRU eviction - remove oldest if over limit
    if (this.cache.size > MAX_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
  
  // Lazy cleanup of expired entries
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > TTL_MS) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }
}

// Global L1 cache instance
export const L1 = new L1Cache();

// In-flight request tracking for stampede protection
const inflight = new Map<string, Promise<any>>();

/**
 * Deterministic object sorting for stable JSON stringification
 */
export function stableSort(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stableSort);
  
  const sorted: Record<string, any> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = stableSort(obj[key]);
  }
  return sorted;
}

/**
 * Generate SHA-256 hex hash from input
 */
export async function sha256Hex(input: unknown): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(stableSort(input)));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate cache key with SHA-256 hashing of all relevant parameters
 */
export async function generateCacheKey(params: CacheKeyParams): Promise<string> {
  // Ensure all relevant parameters are included
  const keyData = {
    vertical: params.vertical,
    auditAnswers: params.auditAnswers,
    moneyLost: params.moneyLost,
    kbVersion: params.kbVersion,
    promptVersion: params.promptVersion,
    model: params.model,
    // AI parameters (only include if defined)
    ...(params.temperature !== undefined && { temperature: params.temperature }),
    ...(params.top_p !== undefined && { top_p: params.top_p }),
    ...(params.max_tokens !== undefined && { max_tokens: params.max_tokens }),
    ...(params.locale && { locale: params.locale }),
    ...(params.kbFilterSignature && { kbFilterSignature: params.kbFilterSignature })
  };
  
  return await sha256Hex(keyData);
}

/**
 * High-level cache orchestration with L1 → L2 → Compute flow
 * Includes stampede protection and negative caching
 */
export async function getOrCompute<T>(
  key: string,
  compute: () => Promise<T>,
  saveL2: (key: string, value: T) => Promise<void>,
  readL2: (key: string) => Promise<T | null>
): Promise<T> {
  // 1. Check L1 cache first
  const l1Result = L1.get(key);
  if (l1Result) {
    return l1Result;
  }
  
  // 2. Check L2 cache
  const l2Result = await readL2(key);
  if (l2Result) {
    // Store in L1 for future requests
    L1.set(key, l2Result);
    return l2Result;
  }
  
  // 3. Stampede protection - check if computation is already in flight
  const existingPromise = inflight.get(key);
  if (existingPromise) {
    return existingPromise;
  }
  
  // 4. Compute new result
  const computePromise = (async () => {
    try {
      const result = await compute();
      
      // Store in L2 (fire-and-forget to avoid blocking)
      saveL2(key, result).catch((error) => {
        console.warn(`L2 cache store failed for key ${key.substring(0, 8)}:`, error.message);
      });
      
      // Store in L1
      L1.set(key, result);
      
      return result;
    } catch (error) {
      // Negative cache for errors (short TTL)
      const errorResult = { error: error.message, timestamp: Date.now() };
      L1.set(key, errorResult, true);
      throw error;
    } finally {
      // Always remove from inflight
      inflight.delete(key);
    }
  })();
  
  inflight.set(key, computePromise);
  return computePromise;
}

/**
 * Cache metrics for monitoring
 */
export function getCacheMetrics() {
  return {
    l1Size: L1.size(),
    l1MaxSize: MAX_SIZE,
    inflightCount: inflight.size,
    ttlMinutes: TTL_MS / (60 * 1000),
    negativeCacheTtlSeconds: NEGATIVE_CACHE_TTL_MS / 1000
  };
}

/**
 * Cleanup utility - run periodically via lazy cleanup
 */
export function performCacheCleanup(): { l1Cleaned: number } {
  const l1Cleaned = L1.cleanup();
  return { l1Cleaned };
}