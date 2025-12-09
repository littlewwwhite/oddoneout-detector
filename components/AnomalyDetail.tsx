import React from 'react';
import { DetectionResult, Language } from '../types';
import { AlertCircle, Check, Maximize2, ZoomIn, Scan } from 'lucide-react';
import { getT } from '../constants/translations';

interface AnomalyDetailProps {
  result: DetectionResult | null;
  isAnalyzing: boolean;
  lang: Language;
  imageSrc?: string;
  isEmpty?: boolean;
}

export const AnomalyDetail: React.FC<AnomalyDetailProps> = ({ result, isAnalyzing, lang, imageSrc, isEmpty }) => {
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        {/* Verdict placeholder */}
        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="p-1.5 bg-indigo-100 rounded-full">
            <Scan className={`w-4 h-4 text-indigo-500 ${showPulse ? 'animate-pulse' : 'opacity-50'}`} />
          </div>
          <div className="flex-1">
            <div className={`h-4 w-24 bg-slate-200 rounded mb-1 ${showPulse ? 'animate-pulse' : ''}`} />
            <div className={`h-3 w-32 bg-slate-100 rounded ${showPulse ? 'animate-pulse' : ''}`} />
          </div>
        </div>

        {/* Stats placeholder */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
            <p className="text-[10px] text-slate-500">{t.gridSize}</p>
            <div className={`h-4 w-16 bg-slate-200 rounded mt-1 ${showPulse ? 'animate-pulse' : ''}`} />
          </div>
          <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
            <p className="text-[10px] text-slate-500">{t.confidence}</p>
            <div className={`h-4 w-12 bg-slate-200 rounded mt-1 ${showPulse ? 'animate-pulse' : ''}`} />
          </div>
        </div>

        {/* Reason placeholder */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Maximize2 className="w-3 h-3" /> {t.reason}
          </h4>
          <div className={`h-16 bg-slate-50 rounded-lg border border-slate-100 ${showPulse ? 'animate-pulse' : ''}`} />
        </div>

        {/* Zoom placeholder */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <ZoomIn className="w-3 h-3" /> {t.zoomView}
          </h4>
          <div className={`aspect-square bg-slate-100 rounded-lg border border-slate-200 ${showPulse ? 'animate-pulse' : ''}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4 animate-in fade-in duration-300">
      {/* Verdict */}
      <div className={`p-3 rounded-lg border flex items-center gap-3 ${result.found ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
        {result.found ? (
          <div className="p-1.5 bg-red-100 rounded-full text-red-600"><AlertCircle className="w-4 h-4" /></div>
        ) : (
          <div className="p-1.5 bg-green-100 rounded-full text-green-600"><Check className="w-4 h-4" /></div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-sm ${result.found ? 'text-red-900' : 'text-green-900'}`}>
            {result.found ? t.found : t.perfect}
          </h3>
          <p className={`text-xs truncate ${result.found ? 'text-red-700' : 'text-green-700'}`}>
            {result.found ? `${t.row} ${result.anomalyPosition?.row}, ${t.col} ${result.anomalyPosition?.col}` : t.perfectDesc}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
          <p className="text-[10px] text-slate-500">{t.gridSize}</p>
          <p className="font-mono font-bold text-sm text-slate-700">{result.gridSize.rows} x {result.gridSize.cols}</p>
        </div>
        <div className={`p-2 border rounded-lg ${getConfidenceColor(result.confidence)}`}>
          <p className="text-[10px] opacity-75">{t.confidence}</p>
          <p className="font-mono font-bold text-sm">{(result.confidence * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Reason */}
      <div>
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Maximize2 className="w-3 h-3" /> {t.reason}
        </h4>
        {result.reason ? (
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
            {result.reason}
          </p>
        ) : (
          <div className="h-12 bg-slate-50 rounded-lg border border-slate-100 animate-pulse" />
        )}
      </div>

      {/* Zoomed View */}
      <div>
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <ZoomIn className="w-3 h-3" /> {t.zoomView}
        </h4>
        {result.found && imageSrc && result.boundingBox ? (() => {
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
              <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${imageSrc})`,
                    backgroundSize: `${1000 / size * 100}%`,
                    backgroundPosition: `${left / (1000 - size) * 100}% ${top / (1000 - size) * 100}%`,
                  }}
                />
                <div className="absolute inset-0 ring-2 ring-inset ring-red-500/50 rounded-lg pointer-events-none" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 text-center">
                {t.row} {result.anomalyPosition?.row}, {t.col} {result.anomalyPosition?.col}
              </p>
            </>
          );
        })() : (
          <div className="aspect-square bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center">
            <p className="text-xs text-slate-400">{t.perfectDesc}</p>
          </div>
        )}
      </div>
    </div>
  );
};
