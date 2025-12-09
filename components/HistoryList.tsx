import React from 'react';
import { HistoryItem, Language } from '../types';
import { CheckCircle2, AlertCircle, ShieldCheck, Loader2, Trash2 } from 'lucide-react';
import { getT } from '../constants/translations';

interface HistoryListProps {
  history: HistoryItem[];
  currentId: string | null;
  onSelect: (item: HistoryItem) => void;
  onClearHistory?: () => void;
  lang: Language;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, currentId, onSelect, onClearHistory, lang }) => {
  const t = getT(lang);

  if (history.length === 0) return null;

  const getStatusIcon = (item: HistoryItem) => {
    if (item.status === 'processing') {
      return <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />;
    }
    if (item.status === 'error') {
      return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    }
    if (item.result?.found) {
      return <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />;
    }
    return <ShieldCheck className="w-3.5 h-3.5 text-green-500" />;
  };

  const getStatusText = (item: HistoryItem) => {
    if (item.status === 'processing') return t.processing;
    if (item.status === 'error') return 'Error';
    if (item.result?.found) return t.found;
    return t.perfect;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[300px]">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 text-sm flex justify-between items-center">
        <span>{t.history}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{history.length}</span>
          {onClearHistory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearHistory();
              }}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
              title={t.clearHistory || 'Clear history'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors ${
              currentId === item.id 
                ? 'bg-indigo-50 border border-indigo-200' 
                : 'hover:bg-slate-50 border border-transparent'
            }`}
          >
            <img 
              src={item.imageSrc} 
              alt="thumbnail" 
              className={`w-10 h-10 rounded object-cover bg-slate-100 ${item.status === 'processing' ? 'opacity-50' : ''}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                {getStatusIcon(item)}
                <span className="text-xs font-medium truncate text-slate-700">
                   {getStatusText(item)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {new Date(item.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};