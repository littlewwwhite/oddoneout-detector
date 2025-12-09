import React, { useState, useEffect, useCallback } from 'react';
import { UploadZone } from './components/UploadZone';
import { ResultViewer } from './components/ResultViewer';
import { LogTerminal } from './components/LogTerminal';
import { HistoryList } from './components/HistoryList';
import { AnomalyDetail } from './components/AnomalyDetail';
import { detectAnomaly } from './services/openrouterService';
import { AppState, DetectionResult, Language, HistoryItem, LogEntry } from './types';
import { Grid, Languages, Plus, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { getT } from './constants/translations';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('zh'); // Default to Chinese
  const t = getT(lang);

  const [queue, setQueue] = useState<File[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [historySidebarOpen, setHistorySidebarOpen] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('oddoneout-history');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
        if (parsedHistory.length > 0) {
          setCurrentHistoryId(parsedHistory[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load history from localStorage:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('oddoneout-history', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save history to localStorage:', error);
    }
  }, [history]);

  // Helper to add fake logs
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: `${timeStr}.${ms}`,
      message,
      type
    }]);
  }, []);

  const processQueue = useCallback(async () => {
    if (queue.length === 0 || isProcessingQueue) return;

    setIsProcessingQueue(true);
    const file = queue[0]; // Take first
    const newQueue = queue.slice(1);
    setQueue(newQueue);

    const historyId = Math.random().toString(36).substr(2, 9);
    addLog(`Starting analysis for ${file.name}`, 'info');

    try {
      // 1. Read File
      addLog(`Reading file stream...`, 'info');
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Update current view immediately
      const tempHistoryItem: HistoryItem = {
        id: historyId,
        timestamp: Date.now(),
        imageSrc: base64,
        result: null,
        status: 'processing' // Initially processing
      };
      // Prepend to history so it shows up selected
      setHistory(prev => [tempHistoryItem, ...prev]);
      setCurrentHistoryId(historyId);

      // 2. Fake Processing Steps (Visual Flair)
      addLog(`Preprocessing image (256x256 resizing)...`, 'info');
      await new Promise(r => setTimeout(r, 300));
      addLog(`Image normalized, applying color correction...`, 'info');
      await new Promise(r => setTimeout(r, 250));
      addLog(`Loading vision model weights...`, 'info');
      await new Promise(r => setTimeout(r, 200));
      addLog(`Running grid detection algorithm...`, 'warning');
      await new Promise(r => setTimeout(r, 350));
      addLog(`Analyzing cell patterns...`, 'warning');

      // 3. API Call
      const startTime = Date.now();
      const result = await detectAnomaly(base64, lang);
      const latency = Date.now() - startTime;
      
      addLog(`Model inference complete (${latency}ms).`, 'success');
      if (result.found) {
        addLog(`Anomaly detected at [${result.anomalyPosition?.row}, ${result.anomalyPosition?.col}]. Confidence: ${result.confidence}`, 'warning');
      } else {
        addLog(`No anomaly detected. Perfect grid confirmed.`, 'success');
      }

      // 4. Update History Item with Result
      setHistory(prev => prev.map(item => 
        item.id === historyId ? { ...item, result: result, status: 'success' } : item
      ));

    } catch (err) {
      console.error(err);
      addLog(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      setHistory(prev => prev.map(item => 
        item.id === historyId ? { ...item, status: 'error' } : item
      ));
    } finally {
      setIsProcessingQueue(false);
    }
  }, [queue, isProcessingQueue, lang, addLog]);

  // Auto-process queue effect
  useEffect(() => {
    if (queue.length > 0 && !isProcessingQueue) {
      processQueue();
    }
  }, [queue, isProcessingQueue, processQueue]);

  const handleFilesSelected = (files: File[]) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        addLog(`File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`, 'error');
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      addLog(`Received ${validFiles.length} file(s) to queue.`, 'info');
      setQueue(prev => [...prev, ...validFiles]);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setCurrentHistoryId(item.id);
  };

  const handleClearHistory = () => {
    if (window.confirm(t.confirmClearHistory || '确定要清除所有历史记录吗？')) {
      setHistory([]);
      setCurrentHistoryId(null);
      addLog('History cleared', 'info');
    }
  };

  const currentItem = history.find(h => h.id === currentHistoryId);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      
      {/* Navbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => setCurrentHistoryId(null)}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none"
            aria-label="Go to home"
          >
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-900/50">
              <Grid className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold tracking-tight leading-none">Odd<span className="text-indigo-400">One</span>Out</h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">{t.subtitle}</p>
            </div>
          </button>
          
          <div className="flex items-center gap-4">
            {/* Removed the Powered By Gemini component as requested */}
             <button 
              onClick={() => setLang(prev => prev === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
            >
               <Languages className="w-4 h-4" />
               {t.switchLang}
             </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visualizer (8 cols) */}
        <div
          className="lg:col-span-8 flex flex-col h-[calc(100vh-8rem)] min-h-[500px]"
          onDrop={(e: React.DragEvent) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files).filter((f: File) => f.type.startsWith('image/'));
            if (files.length > 0) handleFilesSelected(files);
          }}
          onDragOver={(e: React.DragEvent) => e.preventDefault()}
        >
          {currentItem ? (
            <ResultViewer 
              imageSrc={currentItem.imageSrc}
              result={currentItem.result}
              isAnalyzing={!currentItem.result && currentItem.status !== 'error'}
              lang={lang}
            />
          ) : (
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-slate-50 p-6 rounded-full mb-6">
                <Grid className="w-16 h-16 text-slate-300" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.title}</h2>
              <p className="text-slate-500 max-w-md mb-8">{t.uploadDesc}</p>
              <div className="w-full max-w-md pointer-events-auto">
                 <UploadZone onFilesSelected={handleFilesSelected} lang={lang} />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Controls & Logs (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-[calc(100vh-8rem)] min-h-[500px]">
          
          {/* 1. Upload & Queue Status */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-semibold text-slate-700">{t.queue}</h3>
               {queue.length > 0 && (
                 <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full animate-pulse font-medium">
                   {queue.length} pending
                 </span>
               )}
             </div>
             
             {/* Mini Upload Button */}
             <div className="relative">
               <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={(e) => {
                    if(e.target.files) handleFilesSelected(Array.from(e.target.files));
                  }}
               />
               <button className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md">
                 <Plus className="w-4 h-4" />
                 {t.uploadTitle}
               </button>
             </div>
          </div>

          {/* 2. Log Terminal */}
          <LogTerminal logs={logs} lang={lang} />

          {/* 3. Anomaly Detail */}
          <AnomalyDetail
            result={currentItem?.result ?? null}
            isAnalyzing={currentItem ? (!currentItem.result && currentItem.status !== 'error') : false}
            lang={lang}
            imageSrc={currentItem?.imageSrc}
            isEmpty={!currentItem}
          />

        </div>

      </main>

      {/* History Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-white border-r border-slate-200 shadow-xl z-50 transition-transform duration-300 ${historySidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '320px' }}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <History className="w-4 h-4" />
              {t.history}
            </h3>
            <button onClick={() => setHistorySidebarOpen(false)} className="p-1 hover:bg-slate-100 rounded">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <HistoryList
              history={history}
              currentId={currentHistoryId}
              onSelect={(item) => { handleSelectHistory(item); setHistorySidebarOpen(false); }}
              onClearHistory={handleClearHistory}
              lang={lang}
            />
          </div>
        </div>
      </div>

      {/* History Toggle Button */}
      <button
        onClick={() => setHistorySidebarOpen(true)}
        className={`fixed left-0 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-2 py-6 rounded-r-xl shadow-lg hover:bg-indigo-700 transition-all z-40 ${historySidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <div className="flex flex-col items-center gap-2">
          <ChevronRight className="w-5 h-5" />
          <span className="text-sm font-medium [writing-mode:vertical-rl]">{t.history}</span>
          {history.length > 0 && (
            <span className="bg-white text-indigo-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{history.length}</span>
          )}
        </div>
      </button>

      {/* Backdrop */}
      {historySidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setHistorySidebarOpen(false)} />
      )}
    </div>
  );
};

export default App;