
import React, { useState } from 'react';
import VideoUpload from './VideoUpload';
import LoadingSpinner from './LoadingSpinner';
import { generatePromptsFromVideo, VideoDetails } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { useTranslations } from '../i18n/TranslationContext';

const CopyButton: React.FC<{ textToCopy: string, title: string }> = ({ textToCopy, title }) => (
    <button 
        onClick={() => navigator.clipboard.writeText(textToCopy)}
        className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
        title={title}
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    </button>
);


const VideoToPrompt: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [generatedContent, setGeneratedContent] = useState<VideoDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { t } = useTranslations();

  const handleGenerate = async () => {
    if (!videoFile) {
      setError(t('errorUploadVideoFirst'));
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedContent(null);

    try {
      const base64Video = await fileToBase64(videoFile);
      const details = await generatePromptsFromVideo(base64Video, videoFile.type);
      setGeneratedContent(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.unknown'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
        return <div className="absolute inset-0 flex items-center justify-center"><LoadingSpinner message={t('analyzingVideo')}/></div>;
    }
    if (error) {
        return <div className="text-red-400 flex items-center justify-center h-full p-4">{error}</div>;
    }
    if (generatedContent) {
        const { sunoStyleTags, youtubeTitle, youtubeDescription, youtubeHashtags } = generatedContent;
        return (
            <div className="space-y-4">
                <div className="relative p-4 bg-gray-900 rounded-md border border-gray-700">
                    <h4 className="text-md font-semibold text-gray-300 mb-2">{t('sunoStyleTags')}</h4>
                    <p className="text-gray-300 font-mono text-sm bg-gray-800 p-2 rounded">{sunoStyleTags.join(', ')}</p>
                    <CopyButton textToCopy={sunoStyleTags.join(', ')} title={t('copyToClipboard')} />
                </div>
                <div className="relative p-4 bg-gray-900 rounded-md border border-gray-700">
                    <h4 className="text-md font-semibold text-gray-300 mb-2">{t('youtubeTitle')}</h4>
                    <p className="text-gray-300">{youtubeTitle}</p>
                    <CopyButton textToCopy={youtubeTitle} title={t('copyToClipboard')} />
                </div>
                 <div className="relative p-4 bg-gray-900 rounded-md border border-gray-700">
                    <h4 className="text-md font-semibold text-gray-300 mb-2">{t('youtubeDescription')}</h4>
                    <p className="text-gray-300 whitespace-pre-wrap">{youtubeDescription}</p>
                    <CopyButton textToCopy={youtubeDescription} title={t('copyToClipboard')} />
                </div>
                 <div className="relative p-4 bg-gray-900 rounded-md border border-gray-700">
                    <h4 className="text-md font-semibold text-gray-300 mb-2">{t('youtubeHashtags')}</h4>
                    <p className="text-gray-300 text-brand-pink">{youtubeHashtags.map(h => `#${h}`).join(' ')}</p>
                    <CopyButton textToCopy={youtubeHashtags.map(h => `#${h}`).join(' ')} title={t('copyToClipboard')} />
                </div>
            </div>
        );
    }
    return <div className="text-gray-500 flex items-center justify-center h-full">{t('videoDetailsPlaceholder')}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col gap-6">
        <VideoUpload onVideoSelect={setVideoFile} title={t('uploadVideoTitle')} />
        <button
          onClick={handleGenerate}
          disabled={isLoading || !videoFile}
          className="w-full bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('generating') : t('generateDetails')}
        </button>
      </div>

      <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg min-h-[344px] flex flex-col">
        <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('generatedDetails')}</h3>
        <div className="relative w-full h-full flex-grow overflow-y-auto">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default VideoToPrompt;