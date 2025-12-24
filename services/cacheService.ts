import { DetectionResult } from "../types";

interface CacheEntry {
  hash: string;
  filename: string;
  result: DetectionResult;
  resultImagePath: string;
}

interface CacheIndex {
  version: string;
  entries: Record<string, CacheEntry>;
}

let cacheIndex: CacheIndex | null = null;
let cacheLoading: Promise<void> | null = null;

// Simple hash function that works without crypto.subtle
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function computeBase64Hash(base64: string): string {
  const pureBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
  const sample = pureBase64.slice(0, 1000) + pureBase64.slice(-1000) + pureBase64.length;
  return simpleHash(sample);
}

export interface CacheLoadResult {
  success: boolean;
  count: number;
  error?: string;
}

let lastLoadResult: CacheLoadResult | null = null;

export function getCacheLoadResult(): CacheLoadResult | null {
  return lastLoadResult;
}

export async function loadCacheIndex(): Promise<void> {
  if (cacheIndex) return;
  if (cacheLoading) return cacheLoading;

  cacheLoading = (async () => {
    try {
      // Use AbortController with timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/cache/index.json', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        cacheIndex = await response.json();
        const count = Object.keys(cacheIndex!.entries).length;
        console.log(`[Cache] Loaded ${count} cached results`);
        lastLoadResult = { success: true, count };
      } else {
        console.warn(`[Cache] index.json not found (${response.status}), offline cache unavailable`);
        cacheIndex = { version: '1.0', entries: {} };
        lastLoadResult = { success: false, count: 0, error: `HTTP ${response.status}` };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('[Cache] Load timeout, offline cache unavailable');
        lastLoadResult = { success: false, count: 0, error: 'Timeout' };
      } else {
        console.warn('[Cache] Failed to load cache index:', errorMsg);
        lastLoadResult = { success: false, count: 0, error: errorMsg };
      }
      cacheIndex = { version: '1.0', entries: {} };
    } finally {
      // Reset loading state to allow retry if needed
      cacheLoading = null;
    }
  })();

  return cacheLoading;
}

export interface CachedResult {
  result: DetectionResult;
  resultImageUrl: string;
}

export async function findCachedResult(base64Image: string): Promise<CachedResult | null> {
  await loadCacheIndex();
  if (!cacheIndex) return null;

  // Compute hash of the uploaded image
  const hash = computeBase64Hash(base64Image);

  // Look up in cache
  const entry = cacheIndex.entries[hash];
  if (entry) {
    console.log(`[Cache] Hit! Found cached result for hash ${hash}`);
    return {
      result: entry.result,
      resultImageUrl: entry.resultImagePath
    };
  }

  console.log(`[Cache] Miss for hash ${hash}`);
  return null;
}

export function getCacheIndex(): CacheIndex | null {
  return cacheIndex;
}
