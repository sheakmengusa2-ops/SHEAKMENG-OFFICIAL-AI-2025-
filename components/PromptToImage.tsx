import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { generateImageFromPrompt } from '../services/geminiService';
import { useTranslations } from '../i18n/TranslationContext';

const PromptToImage: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const { t } = useTranslations();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError(t('errorEnterPrompt'));
      return;
    }

    setIsLoading(true);
    setError('');
    setImageUrl('');

    try {
      const url = await generateImageFromPrompt(prompt, aspectRatio);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.unknown'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'sheakmeng-ai-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const aspectRatioButtonClasses = (ratio: '16:9' | '9:16') => `
    flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-purple
    ${
      aspectRatio === ratio
        ? 'bg-brand-purple text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }
  `;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('enterPrompt')}</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('promptInputPlaceholder')}
            className="w-full h-40 p-3 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition"
            disabled={isLoading}
          />
        </div>
        <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('aspectRatio')}</h3>
            <div className="flex space-x-2 rounded-lg bg-gray-900 p-1">
                <button onClick={() => setAspectRatio('16:9')} disabled={isLoading} className={aspectRatioButtonClasses('16:9')}>
                    {t('aspectRatioLandscape')}
                </button>
                <button onClick={() => setAspectRatio('9:16')} disabled={isLoading} className={aspectRatioButtonClasses('9:16')}>
                    {t('aspectRatioPortrait')}
                </button>
            </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt}
          className="w-full bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('generating') : t('generateImage')}
        </button>
      </div>
      
      <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-200">{t('generatedImage')}</h3>
        <div className={`w-full ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'} bg-gray-900 rounded-md border border-gray-700 flex items-center justify-center`}>
          {isLoading && <LoadingSpinner message={t('creatingImage')}/>}
          {error && <div className="text-red-400 p-4">{error}</div>}
          {!isLoading && !error && imageUrl && (
            <img src={imageUrl} alt={t('generatedImage')} className="object-contain max-h-full max-w-full rounded-md" />
          )}
          {!isLoading && !error && !imageUrl && (
             <div className="text-gray-500">{t('imagePlaceholder')}</div>
          )}
        </div>
        {imageUrl && !isLoading && (
            <button 
                onClick={handleDownload}
                className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('savePhoto')}
            </button>
        )}
      </div>
    </div>
  );
};

export default PromptToImage;