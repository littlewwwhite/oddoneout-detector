import React, { useState, useRef } from 'react';
import { PresetMapping, Language } from '../types';
import { loadPresets, addPreset, deletePreset, compressImage, MAX_IMAGE_SIZE, getStorageUsage } from '../services/presetService';
import { getT } from '../constants/translations';
import { Plus, Trash2, Image, X, AlertCircle, Check, ZoomIn } from 'lucide-react';

interface PresetManagerProps {
  lang: Language;
  onClose: () => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({ lang, onClose }) => {
  const t = getT(lang);
  const [presets, setPresets] = useState<PresetMapping[]>(loadPresets);
  const [inputImage, setInputImage] = useState<string>('');
  const [outputImage, setOutputImage] = useState<string>('');
  const [zoomImage, setZoomImage] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [found, setFound] = useState<boolean>(true);
  const [confidence, setConfidence] = useState<number>(100);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLInputElement>(null);
  const zoomRef = useRef<HTMLInputElement>(null);

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
      const compressedZoom = zoomImage ? await compressImage(zoomImage, 600) : undefined;
      addPreset({
        inputImageSrc: compressedInput,
        outputImageSrc: compressedOutput,
        reason: reason.trim(),
        found,
        confidence: confidence / 100,
        zoomImageSrc: compressedZoom,
      });
      console.log('[PresetManager] Preset added successfully');
      setPresets(loadPresets());
      setInputImage('');
      setOutputImage('');
      setZoomImage('');
      setReason('');
      setFound(true);
      setConfidence(100);
    } catch (err) {
      console.error('[PresetManager] Failed to add preset:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (lang === 'zh') {
        setError(`存储失败: ${errMsg}`);
      } else {
        setError(`Storage failed: ${errMsg}`);
      }
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
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              {(() => {
                const { used, max, percentage } = getStorageUsage();
                return `${(used / 1024).toFixed(0)}KB / ${(max / 1024 / 1024).toFixed(0)}MB (${percentage.toFixed(0)}%)`;
              })()}
            </span>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-5 border-b border-slate-100">
          <div className="grid grid-cols-3 gap-4 mb-4">
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5" />
                {t.zoomView} <span className="text-slate-400 font-normal">({lang === 'zh' ? '可选' : 'optional'})</span>
              </label>
              <input ref={zoomRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, setZoomImage)} />
              <button onClick={() => zoomRef.current?.click()} className="w-full h-24 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-300 flex items-center justify-center overflow-hidden">
                {zoomImage ? <img src={zoomImage} alt="zoom" className="w-full h-full object-cover" /> : <ZoomIn className="w-8 h-8 text-slate-300" />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t.presetReason}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">{t.confidence}</label>
              <input
                type="number"
                min="0"
                max="100"
                value={confidence}
                onChange={(e) => setConfidence(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-16 px-2 py-2 border border-slate-200 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-slate-400">%</span>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFound(true)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  found ? 'bg-red-100 text-red-700 ring-2 ring-red-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {lang === 'zh' ? '异常' : 'Anomaly'}
              </button>
              <button
                type="button"
                onClick={() => setFound(false)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  !found ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                {lang === 'zh' ? '完美' : 'Perfect'}
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={!inputImage || !outputImage || !reason.trim()}
              className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
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
                <div key={preset.id} className={`flex items-center gap-4 p-3 rounded-xl ${preset.found !== false ? 'bg-red-50' : 'bg-emerald-50'}`}>
                  <img src={preset.inputImageSrc} alt="input" className="w-16 h-16 object-cover rounded-lg" />
                  <span className="text-slate-400">→</span>
                  <img src={preset.outputImageSrc} alt="output" className="w-16 h-16 object-cover rounded-lg" />
                  {preset.zoomImageSrc && (
                    <>
                      <span className="text-slate-400">+</span>
                      <img src={preset.zoomImageSrc} alt="zoom" className="w-16 h-16 object-cover rounded-lg ring-2 ring-indigo-200" />
                    </>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${preset.found !== false ? 'bg-red-200 text-red-700' : 'bg-emerald-200 text-emerald-700'}`}>
                        {preset.found !== false ? (lang === 'zh' ? '异常' : 'Anomaly') : (lang === 'zh' ? '完美' : 'Perfect')}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-medium">
                        {Math.round((preset.confidence ?? 1) * 100)}%
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 truncate mt-1">{preset.reason}</p>
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
