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
        className="group flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-white hover:border-indigo-400 transition-all duration-300 shadow-sm"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" />
          <p className="text-sm font-semibold text-slate-700">
            {t.uploadTitle}
          </p>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
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