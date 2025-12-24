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
    const files = Array.from(event.dataTransfer.files) as File[];
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length > 0) onFilesSelected(imageFiles);
  }, [onFilesSelected]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className="group relative flex flex-col items-center justify-center w-full h-44 border-2 border-slate-200 border-dashed rounded-3xl cursor-pointer bg-slate-50/50 hover:bg-white transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-300"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-violet-50/0 to-indigo-50/0 group-hover:from-indigo-50/40 group-hover:via-white/50 group-hover:to-violet-50/40 transition-all duration-700 opacity-0 group-hover:opacity-100" />
        
        <div className="relative flex flex-col items-center justify-center pt-5 pb-6 text-center px-4 z-10 transform transition-transform duration-300 group-hover:-translate-y-1">
          <div className="p-3.5 bg-white rounded-2xl shadow-sm mb-3 group-hover:scale-110 group-hover:shadow-md group-hover:rotate-3 transition-all duration-300 ring-1 ring-slate-100 group-hover:ring-indigo-100">
            <Upload className="w-6 h-6 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors tracking-tight">
            {t.uploadTitle}
          </p>
          <p className="text-xs text-slate-400 max-w-xs mt-1.5 group-hover:text-slate-500 transition-colors font-medium">
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
