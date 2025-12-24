import { PresetMapping } from "../types";

const STORAGE_KEY = 'oddoneout-presets';
export const MAX_IMAGE_SIZE = 800; // Higher quality
export const JPEG_QUALITY = 0.85; // Better quality

export function compressImage(base64: string, maxSize: number, quality: number = JPEG_QUALITY): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        // Scale down to fit within maxSize
        const scale = Math.min(1, maxSize / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        const result = canvas.toDataURL('image/jpeg', quality);
        // Clean up to prevent memory leaks
        img.onload = null;
        img.onerror = null;
        img.src = '';
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      img.onload = null;
      img.onerror = null;
      reject(new Error('Failed to load image'));
    };
    img.src = base64;
  });
}

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
  // Sample the string for faster hashing
  const sample = pureBase64.slice(0, 1000) + pureBase64.slice(-1000) + pureBase64.length;
  return simpleHash(sample);
}

export function loadPresets(): PresetMapping[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function getStorageUsage(): { used: number; max: number; percentage: number } {
  const data = localStorage.getItem(STORAGE_KEY) || '[]';
  const used = new Blob([data]).size;
  const max = 4 * 1024 * 1024;
  return { used, max, percentage: (used / max) * 100 };
}

export function savePresets(presets: PresetMapping[]): void {
  const data = JSON.stringify(presets);
  const estimatedSize = new Blob([data]).size;
  const maxSize = 4 * 1024 * 1024;
  if (estimatedSize > maxSize) {
    throw new Error(`数据过大: ${(estimatedSize / 1024).toFixed(0)}KB，请删除一些预设`);
  }
  try {
    localStorage.setItem(STORAGE_KEY, data);
  } catch (e) {
    // Handle native QuotaExceededError
    throw new Error(`localStorage 已满，请清理浏览器存储或删除预设`);
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function addPreset(preset: Omit<PresetMapping, 'id' | 'createdAt'>): PresetMapping {
  const presets = loadPresets();
  const newPreset: PresetMapping = {
    ...preset,
    id: generateId(),
    createdAt: Date.now(),
  };
  presets.unshift(newPreset);
  savePresets(presets);
  return newPreset;
}

export function deletePreset(id: string): void {
  const presets = loadPresets().filter(p => p.id !== id);
  savePresets(presets);
}

export interface PresetMatchResult {
  outputImageSrc: string;
  reason: string;
  found: boolean;
  confidence: number;
  zoomImageSrc?: string;
}

export async function findPresetMatch(inputBase64: string): Promise<PresetMatchResult | null> {
  const presets = loadPresets();
  if (presets.length === 0) return null;

  // Compress input image to same size as stored presets before comparing
  const compressedInput = await compressImage(inputBase64, MAX_IMAGE_SIZE);
  const inputHash = computeBase64Hash(compressedInput);

  for (const preset of presets) {
    const presetHash = computeBase64Hash(preset.inputImageSrc);
    if (inputHash === presetHash) {
      console.log(`[Preset] Match found for hash ${inputHash}`);
      return {
        outputImageSrc: preset.outputImageSrc,
        reason: preset.reason,
        found: preset.found ?? true,
        confidence: preset.confidence ?? 1.0,
        zoomImageSrc: preset.zoomImageSrc,
      };
    }
  }

  console.log(`[Preset] No match for hash ${inputHash}`);
  return null;
}
