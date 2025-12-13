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
    <div className="bg-slate-900 rounded-[1.5rem] overflow-hidden shadow-xl shadow-slate-900/10 border border-slate-800 flex flex-col flex-1 min-h-0 ring-4 ring-slate-100">
      <div className="bg-slate-950/50 px-4 py-3 flex items-center justify-between border-b border-slate-800 backdrop-blur">
        <div className="flex items-center gap-2.5 text-slate-400 text-xs font-bold tracking-wider uppercase">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t.logs}</span>
        </div>
        <div className="flex gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-red-500 transition-colors" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-yellow-500 transition-colors" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-emerald-500 transition-colors" />
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-1.5 custom-scrollbar bg-slate-900/50 leading-relaxed">
        {logs.length === 0 && (
          <div className="text-slate-600 italic pl-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-slate-700 rounded-full animate-pulse" />
            System ready. Waiting for input stream...
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-in fade-in duration-300 slide-in-from-left-2 items-start group hover:bg-slate-800/30 -mx-2 px-2 py-0.5 rounded">
            <span className="text-slate-600 shrink-0 select-none group-hover:text-slate-500 transition-colors">[{log.timestamp}]</span>
            <span className={`${
              log.type === 'error' ? 'text-red-400 font-semibold' :
              log.type === 'success' ? 'text-emerald-400' :
              log.type === 'warning' ? 'text-amber-400' :
              'text-indigo-200'
            }`}>
              {log.type !== 'info' && (
                <span className="mr-1.5 uppercase text-[9px] tracking-wider px-1 py-px rounded bg-white/5 border border-white/10 opacity-80">
                  {log.type}
                </span>
              )}
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};