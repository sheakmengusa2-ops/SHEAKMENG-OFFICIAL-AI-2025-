
import React, { useState, useRef, useCallback } from 'react';
import { useTranslations } from '../i18n/TranslationContext';

interface VideoUploadProps {
  onVideoSelect: (file: File | null) => void;
  title: string;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoSelect, title }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const { t } = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
          alert(t('videoFileTooLarge'));
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onVideoSelect(file);
    } else {
      setPreview(null);
      onVideoSelect(null);
    }
  };
  
  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const file = event.dataTransfer.files?.[0];
      if (fileInputRef.current) {
        if(file) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInputRef.current.files = dataTransfer.files;
        }
        const changeEvent = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(changeEvent);
      }
  }, []);

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
      <label 
        className="cursor-pointer flex justify-center w-full h-64 px-4 transition bg-gray-800 border-2 border-gray-600 border-dashed rounded-md appearance-none hover:border-gray-400 focus:outline-none"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {preview ? (
          <video src={preview} controls muted loop className="object-contain h-full w-full" />
        ) : (
          <span className="flex items-center space-x-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
             </svg>
            <span className="font-medium text-gray-500">
              {t('dropVideo')} <span className="text-brand-purple underline">{t('browse')}</span>
            </span>
          </span>
        )}
        <input type="file" name="file_upload" className="hidden" accept="video/mp4,video/webm,video/quicktime" ref={fileInputRef} onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default VideoUpload;