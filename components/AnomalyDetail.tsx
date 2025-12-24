import React from 'react';
import { DetectionResult, Language } from '../types';
import { AlertCircle, Check, Maximize2, ZoomIn, Scan, Grid3X3, Fingerprint, Lightbulb } from 'lucide-react';
import { getT } from '../constants/translations';

interface AnomalyDetailProps {
  result: DetectionResult | null;
  isAnalyzing: boolean;
  lang: Language;
  imageSrc?: string;
  zoomImageSrc?: string;
  isEmpty?: boolean;
}

export const AnomalyDetail: React.FC<AnomalyDetailProps> = ({ result, isAnalyzing, lang, imageSrc, zoomImageSrc, isEmpty }) => {
  const t = getT(lang);

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return "text-emerald-600 bg-emerald-50 border-emerald-100 ring-emerald-500/20";
    if (conf >= 0.7) return "text-amber-600 bg-amber-50 border-amber-100 ring-amber-500/20";
    return "text-red-600 bg-red-50 border-red-100 ring-red-500/20";
  };

    // Empty or Processing state
    if (isEmpty || isAnalyzing || !result) {
      const showPulse = isAnalyzing;
      return (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg shadow-indigo-100/40 p-4 space-y-3 h-full flex flex-col">
          {/* Verdict placeholder */}
          <div className="p-3 rounded-xl border border-white/50 bg-slate-50/50 flex items-center gap-3 flex-shrink-0">
            <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
              <Scan className={`w-4 h-4 text-indigo-500 ${showPulse ? 'animate-pulse' : 'opacity-40'}`} />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className={`h-3 w-20 bg-slate-200/70 rounded-md ${showPulse ? 'animate-pulse' : ''}`} />
              <div className={`h-2.5 w-28 bg-slate-100/70 rounded-md ${showPulse ? 'animate-pulse' : ''}`} />
            </div>
          </div>

          {/* Stats placeholder */}
          <div className="grid grid-cols-2 gap-3 flex-shrink-0">
            <div className="p-3 bg-slate-50/50 border border-white/50 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Grid3X3 className="w-3 h-3 text-slate-400" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t.gridSize}</p>
              </div>
              <div className={`h-5 w-12 bg-slate-200/70 rounded-md ${showPulse ? 'animate-pulse' : ''}`} />
            </div>
            <div className="p-3 bg-slate-50/50 border border-white/50 rounded-xl">
               <div className="flex items-center gap-1.5 mb-1.5">
                <Fingerprint className="w-3 h-3 text-slate-400" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t.confidence}</p>
              </div>
              <div className={`h-5 w-10 bg-slate-200/70 rounded-md ${showPulse ? 'animate-pulse' : ''}`} />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3 min-h-0">
            {/* Zoom placeholder - Expanded */}
            <div className="flex-1 min-h-[140px] flex flex-col">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1 ml-1 flex-shrink-0">
                <ZoomIn className="w-3 h-3" /> {t.zoomView}
              </h4>
              <div className={`flex-1 w-full bg-slate-50/50 rounded-xl border border-white/50 ${showPulse ? 'animate-pulse' : ''}`} />
            </div>
            
             {/* Reason placeholder */}
            <div className="flex-shrink-0 h-24">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1 ml-1">
                <Lightbulb className="w-3 h-3" /> {lang === 'zh' ? '分析建议' : 'Suggestion'}
              </h4>
              <div className={`h-full bg-slate-50/50 rounded-xl border border-white/50 ${showPulse ? 'animate-pulse' : ''}`} />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg shadow-indigo-100/40 p-4 space-y-3 animate-in fade-in duration-500 slide-in-from-bottom-2 h-full flex flex-col">
        {/* Verdict - Fixed Height */}
        <div className={`p-3 rounded-xl border flex items-start gap-3 shadow-sm transition-colors duration-300 flex-shrink-0 ${result.found ? 'bg-red-50/80 border-red-100' : 'bg-emerald-50/80 border-emerald-100'}`}>
          <div className={`p-1.5 rounded-lg shadow-sm mt-0.5 ${result.found ? 'bg-white text-red-600 ring-1 ring-red-200' : 'bg-white text-emerald-600 ring-1 ring-emerald-200'}`}>
             {result.found ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-sm ${result.found ? 'text-red-900' : 'text-emerald-900'}`}>
              {result.found ? t.found : t.perfect}
            </h3>
            <p className={`text-xs mt-0.5 leading-snug line-clamp-2 ${result.found ? 'text-red-700/80' : 'text-emerald-700/80'}`}>
              {result.found
                ? (result.anomalyPosition?.row ? `${t.row} ${result.anomalyPosition.row}, ${t.col} ${result.anomalyPosition.col}` : result.reason)
                : (result.reason || t.perfectDesc)}
            </p>
          </div>
        </div>

        {/* Stats - Fixed Height */}
        <div className="grid grid-cols-2 gap-3 flex-shrink-0">
          <div className="p-3 bg-white/50 border border-slate-200/60 rounded-xl shadow-sm hover:border-indigo-200 transition-colors group">
            <div className="flex items-center gap-1.5 mb-0.5">
               <Grid3X3 className="w-3 h-3 text-slate-400 group-hover:text-indigo-400 transition-colors" />
               <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">{t.gridSize}</p>
            </div>
            <p className="font-mono font-bold text-sm text-slate-700">{result.gridSize.rows} <span className="text-slate-400 text-xs">x</span> {result.gridSize.cols}</p>
          </div>
          <div className={`p-3 border rounded-xl shadow-sm ring-1 ring-inset ${getConfidenceColor(result.confidence)}`}>
            <div className="flex items-center gap-1.5 mb-0.5">
               <Fingerprint className="w-3 h-3 opacity-60" />
               <p className="text-[9px] opacity-75 uppercase tracking-wider font-bold">{t.confidence}</p>
            </div>
            <p className="font-mono font-bold text-sm">{(result.confidence * 100).toFixed(0)}%</p>
          </div>
        </div>

        {/* Flexible Content Area */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
           {/* Zoomed View - Priority to expand */}
           <div className="flex-1 flex flex-col min-h-[140px]">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 ml-1 flex-shrink-0">
              <ZoomIn className="w-3 h-3" /> {t.zoomView}
            </h4>
            <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-200 shadow-md ring-2 ring-white transition-all hover:shadow-xl duration-300 group bg-slate-50">
               {zoomImageSrc ? (
                 <>
                   <img src={zoomImageSrc} alt="zoom" className="absolute inset-0 w-full h-full object-contain p-2" />
                   <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl pointer-events-none" />
                 </>
               ) : result.found && imageSrc && result.boundingBox ? (() => {
                 const box = result.boundingBox!;
                 const boxW = box.xmax - box.xmin;
                 const boxH = box.ymax - box.ymin;
                 const size = Math.max(boxW, boxH) * 2;
                 const centerX = (box.xmin + box.xmax) / 2;
                 const centerY = (box.ymin + box.ymax) / 2;
                 const left = Math.max(0, Math.min(1000 - size, centerX - size / 2));
                 const top = Math.max(0, Math.min(1000 - size, centerY - size / 2));
                 return (
                   <>
                     <div
                       className="absolute inset-0 transition-all duration-700"
                       style={{
                         backgroundImage: `url(${imageSrc})`,
                         backgroundSize: `${1000 / size * 100}%`,
                         backgroundPosition: `${left / (1000 - size) * 100}% ${top / (1000 - size) * 100}%`,
                         backgroundRepeat: 'no-repeat'
                       }}
                     />
                     <div className="absolute inset-0 ring-2 ring-inset ring-red-500/20 rounded-xl pointer-events-none" />
                   </>
                 );
               })() : (
                 <div className="absolute inset-0 flex items-center justify-center">
                   <span className="text-[10px] text-slate-300">N/A</span>
                 </div>
               )}
            </div>
          </div>
          
           {/* Reason - Fixed height bottom */}
          <div className="flex-shrink-0 h-24 flex flex-col">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 ml-1 flex-shrink-0">
              <Lightbulb className="w-3 h-3" /> {lang === 'zh' ? '分析建议' : 'Suggestion'}
            </h4>
            {result.suggestion ? (
              <div className="relative group flex-1">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300 blur" />
                <div className="relative text-xs text-slate-600 leading-relaxed bg-white/60 p-3 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm h-full overflow-y-auto custom-scrollbar">
                  {result.suggestion}
                </div>
              </div>
            ) : (
              <div className="relative group flex-1">
                <div className="relative text-xs text-slate-400 italic leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-white/50 h-full flex items-center justify-center">
                  {lang === 'zh' ? '暂无建议' : 'No suggestion'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
};
