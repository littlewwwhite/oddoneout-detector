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

  // Show only last 5 logs
  const displayLogs = logs.slice(-5);

  return (
    <div
      className="bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg shadow-indigo-100/40 border border-white/60 flex flex-col"
    >
      <div
        className="bg-slate-50/80 px-3 py-2 flex items-center justify-between border-b border-slate-200/60 flex-shrink-0"
      >
        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold tracking-wider uppercase">
          <Terminal className="w-3 h-3" />
          <span>{t.logs}</span>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-[9px] text-slate-400 font-mono hidden sm:inline-block">
                {logs.length > 0 ? `Last: ${logs[logs.length-1].message.substring(0, 30)}...` : 'Ready'}
            </span>
            <div className="flex gap-1.5 opacity-60 mr-1">
              <div className="w-2 h-2 rounded-full bg-slate-300" />
              <div className="w-2 h-2 rounded-full bg-slate-300" />
              <div className="w-2 h-2 rounded-full bg-slate-300" />
            </div>
        </div>
      </div>
      <div className="p-3 font-mono text-[10px] space-y-1.5 bg-white/50 leading-relaxed h-[110px] overflow-hidden">
        {logs.length === 0 && (
          <div className="text-slate-400 italic pl-1 flex items-center gap-2">
            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
            System ready.
          </div>
        )}
        {displayLogs.map((log) => (
          <div key={log.id} className="flex gap-2 items-start -mx-2 px-2 py-0.5 rounded">
            <span className="text-slate-400 shrink-0 select-none font-medium">[{log.timestamp}]</span>
            <span className={`${
              log.type === 'error' ? 'text-red-600 font-semibold' :
              log.type === 'success' ? 'text-emerald-600' :
              log.type === 'warning' ? 'text-amber-600' :
              'text-slate-600'
            }`}>
              {log.type !== 'info' && (
                <span className={`mr-1.5 uppercase text-[8px] tracking-wider px-1 py-px rounded border opacity-90 font-bold ${
                   log.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' :
                   log.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                   'bg-amber-50 border-amber-200 text-amber-600'
                }`}>
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
