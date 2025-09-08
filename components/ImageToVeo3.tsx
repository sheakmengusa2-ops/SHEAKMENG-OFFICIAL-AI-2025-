import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import LoadingSpinner from './LoadingSpinner';
import { generateSpeakingPhotoPrompt } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { useTranslations } from '../i18n/TranslationContext';

const SpeakingPhoto: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [speechText, setSpeechText] = useState<string>('');
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { t } = useTranslations();

  const handleGenerate = async () => {
    if (!imageFile) {
      setError(t('errorUploadImage'));
      return;
    }
    if (!speechText.trim()) {
      setError(t('errorEnterSpeechText'));
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedPrompt('');

    try {
      const base64Image = await fileToBase64(imageFile);
      const prompt = await generateSpeakingPhotoPrompt(base64Image, imageFile.type, speechText);
      setGeneratedPrompt(prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.unknown'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col gap-6">
        <ImageUpload onImageSelect={setImageFile} title={t('uploadStartingTitle')} />
        <div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('enterSpeechPrompt')}</h3>
          <textarea
            value={speechText}
            onChange={(e) => setSpeechText(e.target.value)}
            placeholder={t('speechPlaceholder')}
            className="w-full h-28 p-3 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition"
            disabled={isLoading}
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading || !imageFile || !speechText}
          className="w-full bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('generating') : t('generatePromptForSpeakingPhoto')}
        </button>
      </div>
      
      <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg min-h-[344px] flex flex-col justify-center">
        <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('generatedPrompt')}</h3>
        <div className="relative w-full h-full p-4 bg-gray-900 rounded-md border border-gray-700 min-h-[200px]">
          {isLoading && <div className="absolute inset-0 flex items-center justify-center"><LoadingSpinner message={t('analyzingImage')}/></div>}
          {error && <div className="text-red-400 flex items-center justify-center h-full">{error}</div>}
          {!isLoading && !error && generatedPrompt && (
            <>
              <p className="text-gray-300 whitespace-pre-wrap">{generatedPrompt}</p>
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
          {!isLoading && !error && !generatedPrompt && (
             <div className="text-gray-500 flex items-center justify-center h-full">{t('speakingPromptPlaceholder')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeakingPhoto;