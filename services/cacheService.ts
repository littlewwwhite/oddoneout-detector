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

async function computeMD5(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  // Use first 16 bytes to simulate MD5 length
  const hashArray = Array.from(new Uint8Array(hashBuffer)).slice(0, 16);
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple hash based on file content sampling for fast matching
async function computeImageHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  // Use Web Crypto API for hashing
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

// Alternative: compute hash from base64 string
async function computeBase64Hash(base64: string): Promise<string> {
  // Extract pure base64 data
  const pureBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(pureBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export async function loadCacheIndex(): Promise<void> {
  if (cacheIndex) return;
  if (cacheLoading) return cacheLoading;

  cacheLoading = (async () => {
    try {
      const response = await fetch('/cache/index.json');
      if (response.ok) {
        cacheIndex = await response.json();
        console.log(`[Cache] Loaded ${Object.keys(cacheIndex!.entries).length} cached results`);
      }
    } catch (err) {
      console.warn('[Cache] Failed to load cache index:', err);
      cacheIndex = { version: '1.0', entries: {} };
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
  const hash = await computeBase64Hash(base64Image);

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
