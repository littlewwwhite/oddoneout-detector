import React, { useState, useRef } from 'react';
import { PresetMapping, Language } from '../types';
import { loadPresets, addPreset, deletePreset } from '../services/presetService';
import { getT } from '../constants/translations';
import { Plus, Trash2, Image, X, AlertCircle } from 'lucide-react';

const MAX_IMAGE_SIZE = 200; // max width/height in pixels

function compressImage(base64: string, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
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

interface PresetManagerProps {
  lang: Language;
  onClose: () => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({ lang, onClose }) => {
  const t = getT(lang);
  const [presets, setPresets] = useState<PresetMapping[]>(loadPresets);
  const [inputImage, setInputImage] = useState<string>('');
  const [outputImage, setOutputImage] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0];
    console.log('[PresetManager] handleFileSelect called', { file: file?.name });
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('[PresetManager] File read complete', { resultLength: (reader.result as string)?.length });
      setter(reader.result as string);
    };
    reader.onerror = () => {
      console.error('[PresetManager] File read error', reader.error);
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    console.log('[PresetManager] handleAdd called', { inputImage: !!inputImage, outputImage: !!outputImage, reason });
    if (!inputImage || !outputImage || !reason.trim()) {
      console.log('[PresetManager] Validation failed');
      return;
    }
    setError('');
    try {
      const compressedInput = await compressImage(inputImage, MAX_IMAGE_SIZE);
      const compressedOutput = await compressImage(outputImage, MAX_IMAGE_SIZE);
      addPreset({ inputImageSrc: compressedInput, outputImageSrc: compressedOutput, reason: reason.trim() });
      console.log('[PresetManager] Preset added successfully');
      setPresets(loadPresets());
      setInputImage('');
      setOutputImage('');
      setReason('');
    } catch (err) {
      console.error('[PresetManager] Failed to add preset:', err);
      setError(lang === 'zh' ? '存储空间不足，请删除一些预设后重试' : 'Storage quota exceeded. Please delete some presets and try again.');
    }
  };

  const handleDelete = (id: string) => {
    deletePreset(id);
    setPresets(loadPresets());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{t.presets}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-5 border-b border-slate-100">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.inputImage}</label>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, setInputImage)} />
              <button onClick={() => inputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-300 flex items-center justify-center overflow-hidden">
                {inputImage ? <img src={inputImage} alt="input" className="w-full h-full object-cover" /> : <Image className="w-8 h-8 text-slate-300" />}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.outputImage}</label>
              <input ref={outputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, setOutputImage)} />
              <button onClick={() => outputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-300 flex items-center justify-center overflow-hidden">
                {outputImage ? <img src={outputImage} alt="output" className="w-full h-full object-cover" /> : <Image className="w-8 h-8 text-slate-300" />}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t.presetReason}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleAdd}
              disabled={!inputImage || !outputImage || !reason.trim()}
              className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t.addPreset}
            </button>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {presets.length === 0 ? (
            <div className="text-center py-10 text-slate-400">{t.noPresets}</div>
          ) : (
            <div className="space-y-3">
              {presets.map((preset) => (
                <div key={preset.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <img src={preset.inputImageSrc} alt="input" className="w-16 h-16 object-cover rounded-lg" />
                  <span className="text-slate-400">→</span>
                  <img src={preset.outputImageSrc} alt="output" className="w-16 h-16 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{preset.reason}</p>
                    <p className="text-xs text-slate-400">{new Date(preset.createdAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => handleDelete(preset.id)} className="p-2 hover:bg-red-100 rounded-full text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
