import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { LogEntry, Language } from '../types';
import { getT } from '../constants/translations';

interface LogTerminalProps {
  logs: LogEntry[];
  lang: Language;
}

export const LogTerminal: React.FC<LogTerminalProps> = ({ logs, lang }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const t = getT(lang);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 flex flex-col flex-1 min-h-0">
      <div className="bg-slate-50 px-4 py-2 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
          <Terminal className="w-3.5 h-3.5" />
          <span>{t.logs}</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-300" />
          <div className="w-2 h-2 rounded-full bg-slate-300" />
          <div className="w-2 h-2 rounded-full bg-slate-300" />
        </div>
      </div>
      <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1 custom-scrollbar bg-slate-50/50">
        {logs.length === 0 && (
          <div className="text-slate-400 italic">System ready. Waiting for input stream...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 animate-in fade-in duration-300 slide-in-from-left-2">
            <span className="text-slate-400 shrink-0">[{log.timestamp}]</span>
            <span className={`${
              log.type === 'error' ? 'text-red-500' :
              log.type === 'success' ? 'text-emerald-600' :
              log.type === 'warning' ? 'text-indigo-600' :
              'text-slate-600'
            }`}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};