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
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-sm rounded-[1.5rem] border border-white/60 shadow-xl shadow-indigo-100/50 overflow-hidden ring-1 ring-slate-900/5">

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur sticky top-0 z-10">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2.5">
          {isAnalyzing ? (
            <div className="relative">
              <Scan className="w-5 h-5 text-indigo-500 animate-pulse" />
              <div className="absolute inset-0 bg-indigo-500 blur animate-pulse opacity-50" />
            </div>
          ) : (
            <Scan className="w-5 h-5 text-indigo-600" />
          )}
          <span className="tracking-tight">{isAnalyzing ? t.analyzing : (result?.found ? t.found : t.perfect)}</span>
        </h2>
        {result && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
            result.found
              ? 'bg-indigo-50 text-indigo-700 border-indigo-100 ring-2 ring-indigo-500/10'
              : 'bg-emerald-50 text-emerald-700 border-emerald-100 ring-2 ring-emerald-500/10'
          }`}>
            {result.found
              ? (result.anomalyPosition?.row ? `${t.row} ${result.anomalyPosition.row}, ${t.col} ${result.anomalyPosition.col}` : t.found)
              : t.perfect}
          </span>
        )}
      </div>

      {/* Image Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50/30">

        {/* Main Image */}
        <div className="flex-1 flex items-center justify-center p-6 relative min-h-[300px]">
          <div className="relative shadow-2xl shadow-slate-200 rounded-xl overflow-hidden bg-white max-h-full ring-1 ring-slate-900/5 transition-transform duration-500">
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50">
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            )}
            <img
              src={imageSrc}
              alt="Target"
              className={`max-h-[60vh] object-contain transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
            />

            {imgLoaded && (
              <>
                {/* Scan Effect */}
                {isAnalyzing && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,1)] animate-[scan_2s_ease-in-out_infinite]" />
                    <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                  </div>
                )}

                {/* Success Overlay */}
                {!isAnalyzing && result && !result.found && (
                  <div className="absolute inset-0 border-[6px] border-emerald-500/40 pointer-events-none animate-in fade-in duration-700 rounded-lg">
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2.5 rounded-full shadow-lg shadow-emerald-500/30 animate-in zoom-in duration-300 delay-300">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  </div>
                )}

                {/* Anomaly Box */}
                {showAnomalyBox && (
                  <div
                    className="absolute border-[3px] border-red-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] transition-all duration-500 z-10 animate-in zoom-in duration-300"
                    style={getBoxStyle(result!.boundingBox!)}
                  >
                    <div className="absolute -top-9 left-0 flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap ring-2 ring-white/20">
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
