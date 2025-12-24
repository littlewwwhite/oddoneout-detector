import React, { useState, useEffect, useCallback } from 'react';
import { UploadZone } from './components/UploadZone';
import { ResultViewer } from './components/ResultViewer';
import { LogTerminal } from './components/LogTerminal';
import { HistoryList } from './components/HistoryList';
import { AnomalyDetail } from './components/AnomalyDetail';
import { detectAnomaly } from './services/openrouterService';
import { findCachedResult, loadCacheIndex } from './services/cacheService';
import { findPresetMatch } from './services/presetService';
import { AppState, DetectionResult, Language, HistoryItem, LogEntry } from './types';
import { Grid, Languages, Plus, History, ChevronLeft, ChevronRight, Settings, BookOpen, Sparkles, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { getT } from './constants/translations';
import { SettingsModal } from './components/SettingsModal';
import { TutorialModal } from './components/TutorialModal';
import { CustomHistoryViewModal } from './components/CustomHistoryViewModal';
import { clearHistoryItems, deleteHistoryItem, loadHistoryItemsWithMigration, saveHistoryItem } from './services/historyStore';
import { findCustomRecordMatch } from './services/customRecordStore';

const HISTORY_IMAGE_MAX_SIZE = 1280;
const HISTORY_IMAGE_QUALITY = 0.85;

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('zh'); // Default to Chinese
  const t = getT(lang);

  const [queue, setQueue] = useState<File[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [selectedCustomItem, setSelectedCustomItem] = useState<HistoryItem | null>(null);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);
  // Default to open on larger screens if desired, or false. User asked for "显性显示", so defaulting to true is good.
  const [historySidebarOpen, setHistorySidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [customRecordsOpen, setCustomRecordsOpen] = useState(false);

  // Load history and preload cache index on mount
  useEffect(() => {
    loadCacheIndex();

    let cancelled = false;
    void (async () => {
      try {
        const loaded = await loadHistoryItemsWithMigration();
        if (cancelled) return;
        setHistory(loaded);
        if (loaded.length > 0) {
          setCurrentHistoryId(loaded[0].id);
        }
      } catch (error) {
        console.error('Failed to load history from IndexedDB:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
    let tempHistoryItem: HistoryItem | null = null;

    try {
      // 1. Read File
      addLog(`Reading file stream...`, 'info');
      const originalImageSrc = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      addLog(`Optimizing image for local storage...`, 'info');
      const displayImageSrc = await compressImage(originalImageSrc, HISTORY_IMAGE_MAX_SIZE, HISTORY_IMAGE_QUALITY)
        .catch(() => originalImageSrc);

      // Update current view immediately
      tempHistoryItem = {
        id: historyId,
        timestamp: Date.now(),
        imageSrc: displayImageSrc,
        result: null,
        status: 'processing' // Initially processing
      };
      // Prepend to history so it shows up selected
      setHistory(prev => [tempHistoryItem!, ...prev]);
      setCurrentHistoryId(historyId);
      setSelectedCustomItem(null);
      void saveHistoryItem(tempHistoryItem).catch((error) => {
        console.warn('[History] Failed to persist item:', error);
      });

      // 2. Check custom records first (user-defined presets)
      addLog(`Checking custom records...`, 'info');
      const customMatch = await findCustomRecordMatch(originalImageSrc);

      if (customMatch) {
        addLog(`Custom record match found! Simulating analysis...`, 'success');
        const duration = customMatch.duration || 1500;

        // Simulate processing with custom logs if available
        if (customMatch.customLogs && customMatch.customLogs.length > 0) {
          const logDelay = duration / customMatch.customLogs.length;
          for (const log of customMatch.customLogs) {
            await new Promise(r => setTimeout(r, logDelay));
            addLog(log.message, log.type);
          }
        } else {
          await new Promise(r => setTimeout(r, duration));
        }

        const updatedItem: HistoryItem = {
          ...tempHistoryItem!,
          result: customMatch.result!,
          imageSrc: customMatch.imageSrc,
          zoomImageSrc: customMatch.zoomImageSrc,
          status: 'success',
        };

        setHistory(prev => prev.map(item =>
          item.id === historyId ? updatedItem : item
        ));
        void saveHistoryItem(updatedItem).catch((error) => {
          console.warn('[History] Failed to persist item:', error);
        });
        return;
      }

      // 3. Check user presets
      addLog(`Checking user presets...`, 'info');
      const presetMatch = await findPresetMatch(originalImageSrc);

      if (presetMatch) {
        addLog(`Preset match found! Using predefined result.`, 'success');
        await new Promise(r => setTimeout(r, 300));

        const presetResult: DetectionResult = {
          found: presetMatch.found,
          gridSize: { rows: 0, cols: 0 },
          anomalyPosition: { row: 0, col: 0 },
          description: presetMatch.reason,
          reason: presetMatch.reason,
          confidence: presetMatch.confidence,
        };

        const updatedItem: HistoryItem = {
          ...tempHistoryItem!,
          result: presetResult,
          imageSrc: presetMatch.outputImageSrc,
          zoomImageSrc: presetMatch.zoomImageSrc,
          status: 'success',
        };

        setHistory(prev => prev.map(item =>
          item.id === historyId ? {
            ...item,
            result: presetResult,
            imageSrc: presetMatch.outputImageSrc,
            zoomImageSrc: presetMatch.zoomImageSrc,
            status: 'success'
          } : item
        ));
        void saveHistoryItem(updatedItem).catch((error) => {
          console.warn('[History] Failed to persist item:', error);
        });
        return;
      }

      // 3. Check cache (for offline demo)
      addLog(`Checking local cache...`, 'info');
      const cached = await findCachedResult(originalImageSrc);

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
        const updatedItem: HistoryItem = {
          ...tempHistoryItem!,
          result,
          imageSrc: cached.resultImageUrl,
          status: 'success',
        };

        setHistory(prev => prev.map(item =>
          item.id === historyId ? {
            ...item,
            result: result,
            imageSrc: cached.resultImageUrl, // Use pre-generated result image
            status: 'success'
          } : item
        ));
        void saveHistoryItem(updatedItem).catch((error) => {
          console.warn('[History] Failed to persist item:', error);
        });
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
        const result = await detectAnomaly(originalImageSrc, lang);
        const latency = Date.now() - startTime;

        addLog(`Model inference complete (${latency}ms).`, 'success');
        if (result.found) {
          addLog(`Anomaly detected at [${result.anomalyPosition?.row}, ${result.anomalyPosition?.col}]. Confidence: ${result.confidence}`, 'warning');
        } else {
          addLog(`No anomaly detected. Perfect grid confirmed.`, 'success');
        }

        // Update History Item with Result
        const updatedItem: HistoryItem = {
          ...tempHistoryItem!,
          result,
          status: 'success',
        };

        setHistory(prev => prev.map(item =>
          item.id === historyId ? { ...item, result: result, status: 'success' } : item
        ));
        void saveHistoryItem(updatedItem).catch((error) => {
          console.warn('[History] Failed to persist item:', error);
        });
      }

    } catch (err) {
      console.error(err);
      addLog(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      const failedItem: HistoryItem | null = tempHistoryItem ? { ...tempHistoryItem, status: 'error', result: null } : null;
      setHistory(prev => prev.map(item => 
        item.id === historyId ? { ...item, status: 'error' } : item
      ));
      if (failedItem) {
        void saveHistoryItem(failedItem).catch((error) => {
          console.warn('[History] Failed to persist item:', error);
        });
      }
    } finally {
      setIsProcessingQueue(false);
    }
  }, [queue, isProcessingQueue, lang, addLog]);

  // Auto-process queue effect (only when there's no pending files)
  useEffect(() => {
    if (queue.length > 0 && !isProcessingQueue && pendingFiles.length === 0) {
      processQueue();
    }
  }, [queue, isProcessingQueue, processQueue, pendingFiles]);

  const handleFilesSelected = async (files: File[]) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        addLog(`File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`, 'error');
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const pending: { file: File; preview: string }[] = [];
      for (const file of validFiles) {
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        pending.push({ file, preview });
      }
      setPendingFiles(pending);
      addLog(`${validFiles.length} file(s) ready. Click to start.`, 'info');
    }
  };

  const handleConfirmAnalysis = () => {
    if (pendingFiles.length > 0) {
      setQueue(prev => [...pendingFiles.map(p => p.file), ...prev]);
      setPendingFiles([]);
    }
  };

  const handleCancelPending = () => {
    setPendingFiles([]);
    addLog('Analysis cancelled.', 'info');
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setCurrentHistoryId(item.id);
    setSelectedCustomItem(null);
  };

  const handleSelectCustomRecord = (item: HistoryItem) => {
    setSelectedCustomItem(item);
    setCurrentHistoryId(null);
    if (item.customLogs) {
      setLogs(item.customLogs);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(t.confirmClearHistory || '确定要清除所有历史记录吗？')) {
      setHistory([]);
      setCurrentHistoryId(null);
      addLog('History cleared', 'info');
      void clearHistoryItems().catch((error) => {
        console.warn('[History] Failed to clear history:', error);
      });
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      if (currentHistoryId === id) {
        setCurrentHistoryId(newHistory.length > 0 ? newHistory[0].id : null);
      }
      return newHistory;
    });
    void deleteHistoryItem(id).catch((error) => {
      console.warn('[History] Failed to delete history item:', error);
    });
  };

  const currentItem = selectedCustomItem || history.find(h => h.id === currentHistoryId);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/20 flex flex-col font-sans text-slate-900 selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 z-50 shadow-sm flex-none h-14 lg:h-16">
        <div className="w-full px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
             {/* Toggle Sidebar Button */}
             <button
              onClick={() => setHistorySidebarOpen(!historySidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
              title={historySidebarOpen ? "Hide History" : "Show History"}
            >
              {historySidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => setCurrentHistoryId(null)}
              className="flex items-center gap-3 group focus:outline-none"
              aria-label="Go to home"
            >
              <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-2 rounded-lg shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all duration-300 group-hover:scale-105">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="text-left hidden sm:block">
                <h1 className="text-lg font-bold tracking-tight text-slate-800 group-hover:text-indigo-900 transition-colors">
                  {lang === 'zh' ? '智能医药分析系统' : 'Smart Pharma Analyzer'}
                </h1>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2">
             <button
              onClick={() => setTutorialOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all text-sm font-semibold text-slate-600 hover:text-indigo-600 active:scale-95"
              aria-label="Open tutorial"
            >
               <BookOpen className="w-4 h-4" />
               <span className="hidden sm:inline">{t.tutorial}</span>
             </button>
             <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all text-sm font-semibold text-slate-600 hover:text-indigo-600 active:scale-95"
            >
               <Settings className="w-4 h-4" />
               <span className="hidden sm:inline">{t.settings || 'Settings'}</span>
             </button>
             <button
              onClick={() => setLang(prev => prev === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all text-sm font-semibold text-slate-600 hover:text-indigo-600 active:scale-95"
            >
               <Languages className="w-4 h-4" />
               <span className="uppercase">{lang}</span>
             </button>
          </div>
        </div>
      </header>

      {/* Main Content Area with Flex */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* History Sidebar - Docked */}
        <div 
          className={`flex-none bg-white/80 backdrop-blur-xl border-r border-slate-200/60 z-40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex flex-col ${
            historySidebarOpen ? 'w-[280px] opacity-100' : 'w-0 opacity-0'
          }`}
        >
          <div className="p-3 border-b border-slate-100/50 flex items-center bg-white/40 flex-shrink-0">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm tracking-tight w-full">
              <History className="w-4 h-4 text-indigo-500" />
              {t.history}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <HistoryList
              history={history}
              currentId={currentHistoryId}
              onSelect={(item) => { handleSelectHistory(item); }}
              onClearHistory={handleClearHistory}
              onDeleteItem={handleDeleteHistoryItem}
              lang={lang}
            />
          </div>
        </div>

        {/* Workspace */}
        <main className="flex-1 min-w-0 p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full overflow-hidden">
          
          {/* Left Column: Visualizer (8 cols) */}
          <div
            className="lg:col-span-8 flex flex-col h-full overflow-hidden min-h-0"
            onDrop={(e: React.DragEvent) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files) as File[];
              const imageFiles = files.filter((file) => file.type.startsWith('image/'));
              if (imageFiles.length > 0) handleFilesSelected(imageFiles);
            }}
            onDragOver={(e: React.DragEvent) => e.preventDefault()}
          >
            {pendingFiles.length > 0 ? (
              <div className="flex-1 bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl shadow-indigo-100/50 flex flex-col items-center justify-center p-6 text-center">
                {pendingFiles.length === 1 ? (
                  // Single file preview
                  <div className="w-full max-w-md">
                    <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-lg mb-4">
                      <img src={pendingFiles[0].preview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm text-slate-600 mb-4 font-medium">{pendingFiles[0].file.name}</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleCancelPending}
                        className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                      >
                        {lang === 'zh' ? '取消' : 'Cancel'}
                      </button>
                      <button
                        onClick={handleConfirmAnalysis}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-200"
                      >
                        {lang === 'zh' ? '开始检测' : 'Start Analysis'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Multiple files preview
                  <div className="w-full max-w-lg">
                    <div className="grid grid-cols-3 gap-2 mb-4 max-h-[300px] overflow-y-auto p-2">
                      {pendingFiles.slice(0, 9).map((pf, idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                          <img src={pf.preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {pendingFiles.length > 9 && (
                        <div className="aspect-square rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                          <span className="text-slate-500 font-medium">+{pendingFiles.length - 9}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-4 font-medium">
                      {lang === 'zh' ? `已选择 ${pendingFiles.length} 张图片` : `${pendingFiles.length} images selected`}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleCancelPending}
                        className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                      >
                        {lang === 'zh' ? '取消' : 'Cancel'}
                      </button>
                      <button
                        onClick={handleConfirmAnalysis}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors shadow-lg shadow-violet-200"
                      >
                        {lang === 'zh' ? '批量分析' : 'Batch Analysis'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : currentItem ? (
              <ResultViewer
                imageSrc={currentItem.imageSrc}
                result={currentItem.result}
                isAnalyzing={!currentItem.result && currentItem.status !== 'error'}
                lang={lang}
              />
            ) : (
              <div className="flex-1 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-xl shadow-indigo-100/50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="relative group cursor-default">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                  <div className="relative bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white ring-1 ring-slate-900/5 group-hover:-translate-y-1 transition-transform duration-500">
                    <Grid className="w-12 h-12 text-indigo-500/80 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 tracking-tight">{t.title}</h2>
                <p className="text-slate-500 max-w-sm mb-8 text-base leading-relaxed font-medium">{t.uploadDesc}</p>
                
                <div className="w-full max-w-md pointer-events-auto transform hover:scale-[1.01] transition-transform duration-300">
                   <UploadZone onFilesSelected={handleFilesSelected} lang={lang} />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Controls & Logs (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3 h-full overflow-hidden min-h-0">

            {/* 1. Upload & Queue Status - Compact */}
            <div className="bg-white/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/60 shadow-lg shadow-indigo-100/40 flex-shrink-0 flex items-center justify-between gap-3">
               <div className="flex items-center gap-2">
                 <h3 className="font-bold text-slate-700 tracking-tight text-sm whitespace-nowrap">
                   {t.queue}
                 </h3>
                 {queue.length > 0 && (
                   <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full animate-pulse font-bold shadow-md shadow-indigo-200">
                     {queue.length}
                   </span>
                 )}
               </div>

               <div className="flex items-center gap-2">
                 {/* Single Upload Button */}
                 <div className="relative group">
                   <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      onChange={(e) => {
                        if(e.target.files && e.target.files.length > 0) {
                          handleFilesSelected([e.target.files[0]]);
                        }
                      }}
                   />
                   <button className="px-3 py-2 bg-indigo-600 group-hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 shadow-lg shadow-indigo-200 group-active:scale-[0.98]">
                     <Plus className="w-3.5 h-3.5" />
                     <span className="font-bold text-xs tracking-wide">{lang === 'zh' ? '单张' : 'Single'}</span>
                   </button>
                 </div>

                 {/* Batch Upload Button */}
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
                   <button className="px-3 py-2 bg-violet-600 group-hover:bg-violet-700 text-white rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 shadow-lg shadow-violet-200 group-active:scale-[0.98]">
                     <Plus className="w-3.5 h-3.5" />
                     <span className="font-bold text-xs tracking-wide">{lang === 'zh' ? '批量' : 'Batch'}</span>
                   </button>
                 </div>
               </div>
            </div>

            {/* 2. Anomaly Detail - Compact, auto height */}
            <div className="flex-1 min-h-0 flex flex-col">
              <AnomalyDetail
                result={currentItem?.result ?? null}
                isAnalyzing={currentItem ? (!currentItem.result && currentItem.status !== 'error') : false}
                lang={lang}
                imageSrc={currentItem?.imageSrc}
                zoomImageSrc={currentItem?.zoomImageSrc}
                isEmpty={!currentItem}
              />
            </div>

            {/* 3. Log Terminal - Collapsible & Small by default */}
            <div className="flex-shrink-0">
              <LogTerminal logs={logs} lang={lang} />
            </div>

          </div>

        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} t={t} lang={lang} onOpenCustomRecords={() => setCustomRecordsOpen(true)} />

      {/* Tutorial Modal */}
      <TutorialModal isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} t={t} />

      {/* Custom Records Modal */}
      <CustomHistoryViewModal
        isOpen={customRecordsOpen}
        onClose={() => setCustomRecordsOpen(false)}
        lang={lang}
      />
    </div>
  );
};

export default App;
