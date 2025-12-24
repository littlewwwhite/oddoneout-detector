import React from 'react';
import { DetectionResult, Language } from '../types';
import { AlertCircle, Check, Maximize2, ZoomIn, Scan } from 'lucide-react';
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
    if (conf >= 0.9) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (conf >= 0.7) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

    // Empty or Processing state
    if (isEmpty || isAnalyzing || !result) {
      const showPulse = isAnalyzing;
      return (
        <div className="bg-white/80 backdrop-blur-sm rounded-[1.5rem] border border-white/60 shadow-lg shadow-indigo-100/40 p-5 space-y-5">
          {/* Verdict placeholder */}
          <div className="p-3.5 rounded-xl border border-white/50 bg-slate-50/50 flex items-center gap-3">
            <div className="p-2 bg-indigo-100/50 rounded-full">
              <Scan className={`w-4 h-4 text-indigo-500 ${showPulse ? 'animate-pulse' : 'opacity-50'}`} />
            </div>
            <div className="flex-1">
              <div className={`h-4 w-24 bg-slate-200/70 rounded mb-1.5 ${showPulse ? 'animate-pulse' : ''}`} />
              <div className={`h-3 w-32 bg-slate-100/70 rounded ${showPulse ? 'animate-pulse' : ''}`} />
            </div>
          </div>

          {/* Stats placeholder */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50/50 border border-white/50 rounded-xl">
              <p className="text-[10px] text-slate-500">{t.gridSize}</p>
              <div className={`h-4 w-16 bg-slate-200/70 rounded mt-1.5 ${showPulse ? 'animate-pulse' : ''}`} />
            </div>
            <div className="p-3 bg-slate-50/50 border border-white/50 rounded-xl">
              <p className="text-[10px] text-slate-500">{t.confidence}</p>
              <div className={`h-4 w-12 bg-slate-200/70 rounded mt-1.5 ${showPulse ? 'animate-pulse' : ''}`} />
            </div>
          </div>

          {/* Reason placeholder */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Maximize2 className="w-3 h-3" /> {t.reason}
            </h4>
            <div className={`h-20 bg-slate-50/50 rounded-xl border border-white/50 ${showPulse ? 'animate-pulse' : ''}`} />
          </div>

          {/* Zoom placeholder */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ZoomIn className="w-3 h-3" /> {t.zoomView}
            </h4>
            <div className={`aspect-square bg-slate-50/50 rounded-xl border border-white/50 ${showPulse ? 'animate-pulse' : ''}`} />
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-[1.5rem] border border-white/60 shadow-lg shadow-indigo-100/40 p-5 space-y-5 animate-in fade-in duration-500 slide-in-from-bottom-2">
        {/* Verdict */}
        <div className={`p-3.5 rounded-xl border flex items-center gap-3 shadow-sm ${result.found ? 'bg-red-50/80 border-red-100' : 'bg-emerald-50/80 border-emerald-100'}`}>
          {result.found ? (
            <div className="p-2 bg-red-100 rounded-full text-red-600 shadow-sm"><AlertCircle className="w-4 h-4" /></div>
          ) : (
            <div className="p-2 bg-emerald-100 rounded-full text-green-600 shadow-sm"><Check className="w-4 h-4" /></div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-sm ${result.found ? 'text-red-900' : 'text-emerald-900'}`}>
              {result.found ? t.found : t.perfect}
            </h3>
            <p className={`text-xs truncate ${result.found ? 'text-red-700' : 'text-emerald-700'}`}>
              {result.found
                ? (result.anomalyPosition?.row ? `${t.row} ${result.anomalyPosition.row}, ${t.col} ${result.anomalyPosition.col}` : result.reason)
                : (result.reason || t.perfectDesc)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50/50 border border-white/50 rounded-xl shadow-sm">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{t.gridSize}</p>
            <p className="font-mono font-bold text-sm text-slate-700 mt-0.5">{result.gridSize.rows} x {result.gridSize.cols}</p>
          </div>
          <div className={`p-3 border rounded-xl shadow-sm ${getConfidenceColor(result.confidence)}`}>
            <p className="text-[10px] opacity-75 uppercase tracking-wide">{t.confidence}</p>
            <p className="font-mono font-bold text-sm mt-0.5">{(result.confidence * 100).toFixed(0)}%</p>
          </div>
        </div>

        {/* Reason */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Maximize2 className="w-3 h-3" /> {t.reason}
          </h4>
          {result.reason ? (
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-white/50 shadow-sm">
              {result.reason}
            </p>
          ) : (
            <div className="h-12 bg-slate-50/50 rounded-xl border border-white/50 animate-pulse" />
          )}
        </div>

        {/* Zoomed View */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ZoomIn className="w-3 h-3" /> {t.zoomView}
          </h4>
          {zoomImageSrc ? (
            <div className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-md ring-2 ring-white">
              <img src={zoomImageSrc} alt="zoom" className="w-full h-full object-cover" />
              <div className="absolute inset-0 ring-4 ring-inset ring-indigo-500/30 rounded-xl pointer-events-none" />
            </div>
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
                <div className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-md ring-2 ring-white">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${imageSrc})`,
                      backgroundSize: `${1000 / size * 100}%`,
                      backgroundPosition: `${left / (1000 - size) * 100}% ${top / (1000 - size) * 100}%`,
                    }}
                  />
                  <div className="absolute inset-0 ring-4 ring-inset ring-red-500/30 rounded-xl pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center font-medium">
                  {t.row} {result.anomalyPosition?.row}, {t.col} {result.anomalyPosition?.col}
                </p>
              </>
            );
          })() : (
            <div className="aspect-square bg-slate-50/50 rounded-xl border border-white/50 flex items-center justify-center shadow-inner">
              <p className="text-xs text-slate-400">{result.reason || t.perfectDesc}</p>
            </div>
          )}
        </div>
      </div>
    );
};
