import React from 'react';
import { HistoryItem, Language } from '../types';
import { CheckCircle2, AlertCircle, ShieldCheck, Loader2, Trash2, X } from 'lucide-react';
import { getT } from '../constants/translations';

interface HistoryListProps {
  history: HistoryItem[];
  currentId: string | null;
  onSelect: (item: HistoryItem) => void;
  onClearHistory?: () => void;
  onDeleteItem?: (id: string) => void;
  lang: Language;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, currentId, onSelect, onClearHistory, onDeleteItem, lang }) => {
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
    <div className="bg-transparent flex flex-col flex-1 min-h-0">
      <div className="overflow-y-auto p-3 space-y-2.5 custom-scrollbar flex-1">
        {history.map((item) => (
          <div
            key={item.id}
            className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3.5 transition-all duration-200 group relative ${
              currentId === item.id
                ? 'bg-indigo-50/80 ring-1 ring-indigo-200 shadow-sm'
                : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'
            }`}
          >
            {/* Status Indicator Bar */}
            <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-full transition-colors ${
              item.status === 'processing' ? 'bg-indigo-400/30' :
              item.status === 'error' ? 'bg-red-400/30' :
              item.result?.found ? 'bg-red-500/50' : 'bg-emerald-500/50'
            }`} />

            <button
              onClick={() => onSelect(item)}
              className="flex items-center gap-3.5 flex-1 min-w-0"
            >
              <img
                src={item.imageSrc}
                alt="thumbnail"
                className={`w-12 h-12 rounded-lg object-cover bg-slate-100 ring-1 ring-slate-900/5 ${item.status === 'processing' ? 'opacity-50 grayscale' : ''}`}
              />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {getStatusIcon(item)}
                  <span className={`text-xs font-bold truncate ${currentId === item.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                     {getStatusText(item)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono tracking-tight flex justify-between items-center">
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  {item.result?.confidence && (
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold">{Math.round(item.result.confidence * 100)}%</span>
                  )}
                </p>
              </div>
            </button>

            {/* Delete button */}
            {onDeleteItem && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                title={t.deleteItem || 'Delete'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      
      {history.length > 0 && onClearHistory && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 backdrop-blur-sm">
           <button
              onClick={(e) => {
                e.stopPropagation();
                onClearHistory();
              }}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 p-2.5 rounded-xl transition-all border border-transparent hover:border-red-100 group"
              title={t.clearHistory || 'Clear history'}
            >
              <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              {t.clearHistory || 'Clear History'}
            </button>
        </div>
      )}
    </div>
  );
};
