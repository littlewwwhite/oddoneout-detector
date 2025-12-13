import React, { useState, useEffect, useCallback } from 'react';
import { UploadZone } from './components/UploadZone';
import { ResultViewer } from './components/ResultViewer';
import { LogTerminal } from './components/LogTerminal';
import { HistoryList } from './components/HistoryList';
import { AnomalyDetail } from './components/AnomalyDetail';
import { detectAnomaly } from './services/openrouterService';
import { findCachedResult, loadCacheIndex } from './services/cacheService';
import { AppState, DetectionResult, Language, HistoryItem, LogEntry } from './types';
import { Grid, Languages, Plus, History, ChevronLeft, ChevronRight, Settings, BookOpen } from 'lucide-react';
import { getT } from './constants/translations';
import { SettingsModal } from './components/SettingsModal';
import { TutorialModal } from './components/TutorialModal';
import { isApiConfigured } from './services/configService';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('zh'); // Default to Chinese
  const t = getT(lang);

  const [queue, setQueue] = useState<File[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [historySidebarOpen, setHistorySidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(!isApiConfigured());
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Load history from localStorage and preload cache index on mount
  useEffect(() => {
    // Preload cache index for offline matching
    loadCacheIndex();

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

      // 2. Check cache first (for offline demo)
      addLog(`Checking local cache...`, 'info');
      const cached = await findCachedResult(base64);

      if (cached) {
        // Cache hit - use pre-generated result
        addLog(`Cache hit! Using pre-analyzed result.`, 'success');
        await new Promise(r => setTimeout(r, 300)); // Brief delay for UX

        const result = cached.result;
        if (result.found) {
          addLog(`Anomaly detected at [${result.anomalyPosition?.row}, ${result.anomalyPosition?.col}]. Confidence: ${result.confidence}`, 'warning');
        } else {
          addLog(`No anomaly detected. Perfect grid confirmed.`, 'success');
        }

        // Update history with cached result and pre-generated result image
        setHistory(prev => prev.map(item =>
          item.id === historyId ? {
            ...item,
            result: result,
            imageSrc: cached.resultImageUrl, // Use pre-generated result image
            status: 'success'
          } : item
        ));
      } else {
        // Cache miss - call API
        addLog(`Cache miss. Calling vision API...`, 'info');

        // Fake Processing Steps (Visual Flair)
        addLog(`Preprocessing image (256x256 resizing)...`, 'info');
        await new Promise(r => setTimeout(r, 300));
        addLog(`Image normalized, applying color correction...`, 'info');
        await new Promise(r => setTimeout(r, 250));
        addLog(`Loading vision model weights...`, 'info');
        await new Promise(r => setTimeout(r, 200));
        addLog(`Running grid detection algorithm...`, 'warning');
        await new Promise(r => setTimeout(r, 350));
        addLog(`Analyzing cell patterns...`, 'warning');

        // API Call
        const startTime = Date.now();
        const result = await detectAnomaly(base64, lang);
        const latency = Date.now() - startTime;

        addLog(`Model inference complete (${latency}ms).`, 'success');
        if (result.found) {
          addLog(`Anomaly detected at [${result.anomalyPosition?.row}, ${result.anomalyPosition?.col}]. Confidence: ${result.confidence}`, 'warning');
        } else {
          addLog(`No anomaly detected. Perfect grid confirmed.`, 'success');
        }

        // Update History Item with Result
        setHistory(prev => prev.map(item =>
          item.id === historyId ? { ...item, result: result, status: 'success' } : item
        ));
      }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30 flex flex-col font-sans text-slate-900 selection:bg-indigo-500/30">
      
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => setCurrentHistoryId(null)}
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="Go to home"
          >
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all duration-300 group-hover:scale-105">
              <Grid className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold tracking-tight text-slate-800 group-hover:text-indigo-900 transition-colors">
                Odd<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">One</span>Out
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">{t.subtitle}</p>
            </div>
          </button>
          
          <div className="flex items-center gap-4">
             <button
              onClick={() => setTutorialOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-100 transition-all text-sm font-medium text-slate-600 hover:text-indigo-600 border border-transparent hover:border-slate-200"
              aria-label="Open tutorial"
            >
               <BookOpen className="w-4 h-4" />
               {t.tutorial}
             </button>
             <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-100 transition-all text-sm font-medium text-slate-600 hover:text-indigo-600 border border-transparent hover:border-slate-200"
            >
               <Settings className="w-4 h-4" />
               {t.settings || 'Settings'}
             </button>
             <button
              onClick={() => setLang(prev => prev === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-100 transition-all text-sm font-medium text-slate-600 hover:text-indigo-600 border border-transparent hover:border-slate-200"
            >
               <Languages className="w-4 h-4" />
               {t.switchLang}
             </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Visualizer (8 cols) */}
        <div
          className="lg:col-span-8 flex flex-col h-[calc(100vh-9rem)] min-h-[600px]"
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
            <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-[2rem] border border-white/50 shadow-xl shadow-indigo-100/50 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-700">
              <div className="bg-gradient-to-br from-white to-slate-50 p-8 rounded-full mb-8 shadow-inner border border-slate-100 ring-8 ring-white/50">
                <Grid className="w-16 h-16 text-indigo-200" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">{t.title}</h2>
              <p className="text-slate-500 max-w-md mb-10 text-lg leading-relaxed">{t.uploadDesc}</p>
              <div className="w-full max-w-lg pointer-events-auto transform hover:scale-[1.01] transition-transform duration-300">
                 <UploadZone onFilesSelected={handleFilesSelected} lang={lang} />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Controls & Logs (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-[calc(100vh-9rem)] min-h-[600px] overflow-y-auto">

          {/* 1. Upload & Queue Status */}
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-[1.5rem] border border-white/60 shadow-lg shadow-indigo-100/40 flex-shrink-0">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-700 tracking-tight">{t.queue}</h3>
               {queue.length > 0 && (
                 <span className="text-xs bg-indigo-500 text-white px-2.5 py-1 rounded-full animate-pulse font-bold shadow-md shadow-indigo-200">
                   {queue.length} pending
                 </span>
               )}
             </div>
             
             {/* Mini Upload Button */}
             <div className="relative group">
               <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  onChange={(e) => {
                    if(e.target.files) handleFilesSelected(Array.from(e.target.files));
                  }}
               />
               <button className="w-full py-3.5 bg-slate-900 group-hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 shadow-md group-hover:shadow-indigo-200 group-active:scale-[0.98]">
                 <Plus className="w-4 h-4" />
                 <span className="font-medium">{t.uploadTitle}</span>
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
      <div className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-2xl z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${historySidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '340px' }}>
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2.5 text-lg">
              <History className="w-5 h-5 text-indigo-500" />
              {t.history}
            </h3>
            <button onClick={() => setHistorySidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
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
        className={`fixed left-0 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur border border-slate-200 text-indigo-600 pl-1 pr-1.5 py-6 rounded-r-2xl shadow-[4px_0_24px_-4px_rgba(0,0,0,0.1)] hover:pl-2 transition-all duration-300 z-40 group ${historySidebarOpen ? 'opacity-0 pointer-events-none translate-x-[-20px]' : 'opacity-100 translate-x-0'}`}
      >
        <div className="flex flex-col items-center gap-3">
          <ChevronRight className="w-5 h-5 group-hover:scale-125 transition-transform" />
          <span className="text-[10px] font-bold tracking-widest uppercase [writing-mode:vertical-rl] text-slate-400 group-hover:text-indigo-600 transition-colors">{t.history}</span>
          {history.length > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-indigo-200">{history.length}</span>
          )}
        </div>
      </button>

      {/* Backdrop */}
      {historySidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setHistorySidebarOpen(false)} />
      )}

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} t={t} />

      {/* Tutorial Modal */}
      <TutorialModal isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} t={t} />
    </div>
  );
};

export default App;