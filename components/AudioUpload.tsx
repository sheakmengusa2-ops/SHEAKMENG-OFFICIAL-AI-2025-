
import React, { useState, useRef, useCallback } from 'react';
import { useTranslations } from '../i18n/TranslationContext';

interface AudioUploadProps {
  onAudioSelect: (file: File | null) => void;
  title: string;
}

const AudioUpload: React.FC<AudioUploadProps> = ({ onAudioSelect, title }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const { t } = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
          alert(t('audioFileTooLarge'));
          return;
      }
      setFileName(file.name);
      onAudioSelect(file);
    } else {
      setFileName(null);
      onAudioSelect(null);
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
        className="cursor-pointer flex justify-center items-center w-full h-24 px-4 transition bg-gray-800 border-2 border-gray-600 border-dashed rounded-md appearance-none hover:border-gray-400 focus:outline-none"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <span className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" />
            </svg>
            <span className="font-medium text-gray-500">
                {fileName || <>{t('dropAudio')} <span className="text-brand-purple underline">{t('browse')}</span></>}
            </span>
        </span>
        <input type="file" name="file_upload" className="hidden" accept="audio/mpeg,audio/wav,audio/ogg" ref={fileInputRef} onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default AudioUpload;