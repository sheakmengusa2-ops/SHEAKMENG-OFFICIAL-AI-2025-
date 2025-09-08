import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import LoadingSpinner from './LoadingSpinner';
import { generateVideoFromImageAndPrompt } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { useTranslations } from '../i18n/TranslationContext';

const ImageToVideo: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const { t } = useTranslations();

  const handleProgress = (messageKey: string) => {
    setLoadingMessage(t(messageKey));
  };
  
  const handleGenerate = async () => {
    if (!imageFile) {
      setError(t('errorUploadImage'));
      return;
    }
    if (!prompt.trim()) {
      setError(t('errorEnterPrompt'));
      return;
    }

    setIsLoading(true);
    setError('');
    setVideoUrl('');
    setLoadingMessage(t('preparingAssets'));

    try {
      const base64Image = await fileToBase64(imageFile);
      const url = await generateVideoFromImageAndPrompt(base64Image, imageFile.type, prompt, aspectRatio, handleProgress);
      setVideoUrl(url);
    } catch (err) {
      if (err instanceof Error) {
        const [key, param] = err.message.split('|');
        if (key === 'error.videoDownloadFailed' && param) {
            setError(t(key, { statusText: param }));
        } else {
            setError(t(key) || t('error.unknown'));
        }
      } else {
        setError(t('error.unknown'));
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
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
        <ImageUpload onImageSelect={setImageFile} title={t('uploadStartingTitle')} />
        <div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('enterAnimationPrompt')}</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('animationPromptPlaceholder')}
            className="w-full h-28 p-3 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition"
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
          disabled={isLoading || !imageFile || !prompt}
          className="w-full bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('generating') : t('generateVideo')}
        </button>
      </div>
      
      <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col justify-center gap-4">
        <h3 className="text-lg font-semibold text-gray-200">{t('generatedVideo')}</h3>
        <div className={`w-full ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'} bg-gray-900 rounded-md border border-gray-700 flex items-center justify-center`}>
          {isLoading && <LoadingSpinner message={loadingMessage}/>}
          {error && <div className="text-red-400 p-4">{error}</div>}
          {!isLoading && !error && videoUrl && (
            <video src={videoUrl} controls autoPlay loop className="object-contain max-h-full max-w-full rounded-md" />
          )}
          {!isLoading && !error && !videoUrl && (
             <div className="text-gray-500">{t('videoPlaceholder')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageToVideo;