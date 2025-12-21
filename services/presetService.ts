import { PresetMapping } from "../types";

const STORAGE_KEY = 'oddoneout-presets';
const MAX_IMAGE_SIZE = 200;

function compressImage(base64: string, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = base64;
  });
}

async function computeBase64Hash(base64: string): Promise<string> {
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

export function loadPresets(): PresetMapping[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function savePresets(presets: PresetMapping[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function addPreset(preset: Omit<PresetMapping, 'id' | 'createdAt'>): PresetMapping {
  const presets = loadPresets();
  const newPreset: PresetMapping = {
    ...preset,
    id: crypto.randomUUID(),
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
}

export async function findPresetMatch(inputBase64: string): Promise<PresetMatchResult | null> {
  const presets = loadPresets();
  if (presets.length === 0) return null;

  // Compress input image to same size as stored presets before comparing
  const compressedInput = await compressImage(inputBase64, MAX_IMAGE_SIZE);
  const inputHash = await computeBase64Hash(compressedInput);

  for (const preset of presets) {
    const presetHash = await computeBase64Hash(preset.inputImageSrc);
    if (inputHash === presetHash) {
      console.log(`[Preset] Match found for hash ${inputHash}`);
      return {
        outputImageSrc: preset.outputImageSrc,
        reason: preset.reason,
      };
    }
  }

  console.log(`[Preset] No match for hash ${inputHash}`);
  return null;
}
