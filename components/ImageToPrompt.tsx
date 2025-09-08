import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import LoadingSpinner from './LoadingSpinner';
import { generatePromptFromImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { useTranslations } from '../i18n/TranslationContext';

const ImageToPrompt: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { t } = useTranslations();

  const handleGenerate = async () => {
    if (!imageFile) {
      setError(t('errorUploadFirst'));
      return;
    }

    setIsLoading(true);
    setError('');
    setPrompt('');

    try {
      const base64Image = await fileToBase64(imageFile);
      const generatedPrompt = await generatePromptFromImage(base64Image, imageFile.type);
      setPrompt(generatedPrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.unknown'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col gap-6">
        <ImageUpload onImageSelect={setImageFile} title={t('uploadTitle')} />
        <button
          onClick={handleGenerate}
          disabled={isLoading || !imageFile}
          className="w-full bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('generating') : t('generatePrompt')}
        </button>
      </div>

      <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg min-h-[344px] flex flex-col justify-center">
        <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('generatedPrompt')}</h3>
        <div className="relative w-full h-full p-4 bg-gray-900 rounded-md border border-gray-700 min-h-[200px]">
          {isLoading && <div className="absolute inset-0 flex items-center justify-center"><LoadingSpinner message={t('analyzingImage')}/></div>}
          {error && <div className="text-red-400 flex items-center justify-center h-full">{error}</div>}
          {!isLoading && !error && prompt && (
            <>
              <p className="text-gray-300 whitespace-pre-wrap">{prompt}</p>
              <button 
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                title={t('copyToClipboard')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </>
          )}
          {!isLoading && !error && !prompt && (
             <div className="text-gray-500 flex items-center justify-center h-full">{t('promptPlaceholder')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageToPrompt;