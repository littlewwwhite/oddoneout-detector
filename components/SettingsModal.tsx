import React, { useState, useEffect } from 'react';
import { X, Key, Globe, Cpu, Eye, EyeOff, ChevronDown, PenLine } from 'lucide-react';
import { ApiConfig, getApiConfig, saveApiConfig } from '../services/configService';
import { Language } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Record<string, string>;
  lang: Language;
  onOpenCustomRecords?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, t, lang, onOpenCustomRecords }) => {
  const [config, setConfig] = useState<ApiConfig>(getApiConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getApiConfig());
      setSaved(false);
      setAdvancedOpen(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveApiConfig(config);
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{t.settings || 'API Settings'}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Globe className="w-4 h-4" />
              {t.apiUrl || 'API URL'}
            </label>
            <input
              type="url"
              value={config.apiUrl}
              onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
              placeholder="https://api.openai.com/v1/chat/completions"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              {t.apiUrlHint || 'OpenAI compatible endpoint (e.g., OpenAI, SiliconFlow, OpenRouter)'}
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Key className="w-4 h-4" />
              {t.apiKey || 'API Key'}
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4 text-slate-500" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Cpu className="w-4 h-4" />
              {t.model || 'Model'}
            </label>
            <input
              type="text"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              placeholder="gpt-4o"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-mono"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              {t.modelHint || 'Vision model with image understanding capability'}
            </p>
          </div>

          {/* Advanced Section */}
          <div className="border-t border-slate-200 pt-4">
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="w-full flex items-center justify-between text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              <span>{t.advanced || 'Advanced'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </button>
            {advancedOpen && onOpenCustomRecords && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenCustomRecords();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-left"
                >
                  <PenLine className="w-5 h-5 text-violet-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{lang === 'zh' ? '自定义记录' : 'Custom Records'}</p>
                    <p className="text-xs text-slate-500">{lang === 'zh' ? '管理自定义预设记录' : 'Manage custom preset records'}</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {t.cancel || 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-all ${
              saved
                ? 'bg-green-500'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {saved ? (t.saved || 'Saved!') : (t.save || 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
};
