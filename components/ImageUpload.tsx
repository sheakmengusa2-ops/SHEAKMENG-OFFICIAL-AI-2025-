import React, { useState, useRef, useCallback } from 'react';
import { useTranslations } from '../i18n/TranslationContext';

interface ImageUploadProps {
  onImageSelect: (file: File | null) => void;
  title: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, title }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const { t } = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
          alert(t('fileTooLarge'));
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelect(file);
    } else {
      setPreview(null);
      onImageSelect(null);
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
        // Manually trigger change event
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
          <img src={preview} alt="Image preview" className="object-contain h-full w-full" />
        ) : (
          <span className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="font-medium text-gray-500">
              {t('dropImage')} <span className="text-brand-purple underline">{t('browse')}</span>
            </span>
          </span>
        )}
        <input type="file" name="file_upload" className="hidden" accept="image/png, image/jpeg, image/webp" ref={fileInputRef} onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default ImageUpload;