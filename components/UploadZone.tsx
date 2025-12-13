import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Language } from '../types';
import { getT } from '../constants/translations';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  lang: Language;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, lang }) => {
  const t = getT(lang);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFilesSelected(Array.from(event.target.files));
    }
  }, [onFilesSelected]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) onFilesSelected(files);
  }, [onFilesSelected]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className="group relative flex flex-col items-center justify-center w-full h-40 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-white transition-all duration-300 overflow-hidden"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/0 via-indigo-50/0 to-indigo-50/0 group-hover:from-indigo-50/50 group-hover:to-violet-50/50 transition-all duration-500" />
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-400/50 rounded-2xl border-dashed transition-all duration-300" />
        
        <div className="relative flex flex-col items-center justify-center pt-5 pb-6 text-center px-4 z-10">
          <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
            <Upload className="w-6 h-6 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">
            {t.uploadTitle}
          </p>
          <p className="text-xs text-slate-400 max-w-xs mt-1 group-hover:text-slate-500 transition-colors">
            {t.uploadDesc}
          </p>
        </div>
        <input 
          id="file-upload" 
          type="file" 
          className="hidden" 
          accept="image/*"
          multiple // Allow multiple files
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};