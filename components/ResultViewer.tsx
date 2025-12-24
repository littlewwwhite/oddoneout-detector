import React, { useState } from 'react';
import { DetectionResult, BoundingBox, Language } from '../types';
import { Scan, ShieldCheck } from 'lucide-react';
import { getT } from '../constants/translations';

interface ResultViewerProps {
  imageSrc: string;
  result: DetectionResult | null;
  isAnalyzing: boolean;
  lang: Language;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({
  imageSrc,
  result,
  isAnalyzing,
  lang
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(imageSrc);
  const t = getT(lang);

  if (imageSrc !== currentSrc) {
    setCurrentSrc(imageSrc);
    setImgLoaded(false);
  }

  const getBoxStyle = (box: BoundingBox) => {
    const w = box.xmax - box.xmin;
    const h = box.ymax - box.ymin;
    const paddingX = w * 0.1;
    const paddingY = h * 0.1;
    const ymin = Math.max(0, box.ymin - paddingY);
    const xmin = Math.max(0, box.xmin - paddingX);
    const ymax = Math.min(1000, box.ymax + paddingY);
    const xmax = Math.min(1000, box.xmax + paddingX);
    return {
      top: `${ymin / 10}%`,
      left: `${xmin / 10}%`,
      height: `${(ymax - ymin) / 10}%`,
      width: `${(xmax - xmin) / 10}%`,
    };
  };

  const showAnomalyBox = !isAnalyzing && result?.found && result.boundingBox &&
    (result.boundingBox.xmax > result.boundingBox.xmin && result.boundingBox.ymax > result.boundingBox.ymin);

  return (
    <div className="flex flex-col h-full bg-white/90 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl shadow-indigo-100/50 overflow-hidden ring-1 ring-slate-900/5">

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-200/60 flex justify-between items-center bg-white/60 backdrop-blur-xl sticky top-0 z-20 flex-shrink-0">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          {isAnalyzing ? (
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
              <Scan className="relative w-4 h-4 text-indigo-500" />
            </div>
          ) : (
            <div className="p-1 bg-indigo-50 rounded-lg">
              <Scan className="w-4 h-4 text-indigo-600" />
            </div>
          )}
          <span className="tracking-tight">{isAnalyzing ? t.analyzing : (result?.found ? t.found : t.perfect)}</span>
        </h2>
        {result && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm transition-all duration-300 ${
            result.found
              ? 'bg-red-50 text-red-700 border-red-100 ring-1 ring-red-500/10'
              : 'bg-emerald-50 text-emerald-700 border-emerald-100 ring-1 ring-emerald-500/10'
          }`}>
            {result.found
              ? (result.anomalyPosition?.row ? `${t.row} ${result.anomalyPosition.row}, ${t.col} ${result.anomalyPosition.col}` : t.found)
              : t.perfect}
          </span>
        )}
      </div>

      {/* Image Area - Flex 1 to take remaining height */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 relative min-h-0">
        {/* Grid Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ 
               backgroundImage: `radial-gradient(#4f46e5 1px, transparent 1px)`, 
               backgroundSize: '20px 20px' 
             }} 
        />

        {/* Main Image Container */}
        <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
          <div className="relative shadow-2xl shadow-slate-200/60 rounded-xl overflow-hidden bg-white max-h-full max-w-full ring-1 ring-slate-900/5 transition-transform duration-500 flex justify-center">
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50 min-h-[200px] min-w-[200px]">
                <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            )}
            <img
              src={imageSrc}
              alt="Target"
              className={`max-h-full max-w-full object-contain transition-all duration-700 ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              onLoad={() => setImgLoaded(true)}
            />

            {imgLoaded && (
              <>
                {/* Scan Effect */}
                {isAnalyzing && (
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-xl">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_20px_2px_rgba(99,102,241,0.6)] animate-[scan_2s_ease-in-out_infinite]" />
                    <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                  </div>
                )}

                {/* Success Overlay */}
                {!isAnalyzing && result && !result.found && (
                  <div className="absolute inset-0 border-[6px] border-emerald-500/40 pointer-events-none animate-in fade-in duration-700 rounded-xl">
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg shadow-emerald-500/30 animate-in zoom-in duration-300 delay-300">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                )}

                {/* Anomaly Box */}
                {showAnomalyBox && (
                  <div
                    className="absolute border-[3px] border-red-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-500 z-10 animate-in zoom-in duration-300"
                    style={getBoxStyle(result!.boundingBox!)}
                  >
                    <div className="absolute -top-8 left-0 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap ring-1 ring-white/20">
                      {t.confidence}: {(result!.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
