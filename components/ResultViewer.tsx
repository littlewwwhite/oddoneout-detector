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
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          {isAnalyzing ? <Scan className="w-5 h-5 text-indigo-500 animate-pulse" /> : <Scan className="w-5 h-5 text-indigo-600" />}
          {isAnalyzing ? t.analyzing : (result?.found ? t.found : t.perfect)}
        </h2>
        {result && (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            result.found ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-green-50 text-green-700 border-green-100'
          }`}>
            {result.found ? `${t.row} ${result.anomalyPosition?.row}, ${t.col} ${result.anomalyPosition?.col}` : t.perfect}
          </span>
        )}
      </div>

      {/* Image Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* Main Image */}
        <div className="flex-1 bg-slate-50/50 flex items-center justify-center p-4 relative min-h-[300px]">
          <div className="relative shadow-sm rounded-lg overflow-hidden bg-white max-h-full">
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            )}
            <img
              src={imageSrc}
              alt="Target"
              className={`max-h-[55vh] object-contain transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
            />

            {imgLoaded && (
              <>
                {/* Scan Effect */}
                {isAnalyzing && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/80 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scan_1.5s_ease-in-out_infinite]" />
                    <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                  </div>
                )}

                {/* Success Overlay */}
                {!isAnalyzing && result && !result.found && (
                  <div className="absolute inset-0 border-8 border-green-500/30 pointer-events-none animate-in fade-in duration-700">
                    <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  </div>
                )}

                {/* Anomaly Box */}
                {showAnomalyBox && (
                  <div
                    className="absolute border-2 border-red-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.3)] transition-all duration-500 z-10"
                    style={getBoxStyle(result!.boundingBox!)}
                  >
                    <div className="absolute -top-7 left-0 flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap">
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
