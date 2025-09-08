

import React, { useState, useRef, useEffect } from 'react';
import VideoUpload from './VideoUpload';
import AudioUpload from './AudioUpload';
import LoadingSpinner from './LoadingSpinner';
import { generateAudioPromptFromVideo, recommendVideoFilter } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { useTranslations } from '../i18n/TranslationContext';

type FilterType = 'None' | 'Noir' | 'Vintage' | 'Vibrant';

const VideoEdit: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<FilterType>('None');
  
  const [audioPrompt, setAudioPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecommending, setIsRecommending] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const { t } = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setVideoUrl('');
  }, [videoFile]);
  
  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setAudioUrl('');
  }, [audioFile]);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || !audioUrl) return;

    const syncPlay = () => audio.play();
    const syncPause = () => audio.pause();
    const syncTime = () => { if (Math.abs(video.currentTime - audio.currentTime) > 0.1) { audio.currentTime = video.currentTime; } };
    const syncRate = () => { audio.playbackRate = video.playbackRate; };

    video.addEventListener('play', syncPlay);
    video.addEventListener('pause', syncPause);
    video.addEventListener('seeking', syncTime);
    video.addEventListener('seeked', syncTime);
    video.addEventListener('ratechange', syncRate);

    syncTime();
    syncRate();

    return () => {
      video.removeEventListener('play', syncPlay);
      video.removeEventListener('pause', syncPause);
      video.removeEventListener('seeking', syncTime);
      video.removeEventListener('seeked', syncTime);
      video.removeEventListener('ratechange', syncRate);
    };
  }, [videoUrl, audioUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleGenerateAudioPrompt = async () => {
    if (!videoFile) {
      setError(t('errorUploadVideoFirst'));
      return;
    }
    setIsLoading(true);
    setError('');
    setAudioPrompt('');
    try {
      const base64Video = await fileToBase64(videoFile);
      const result = await generateAudioPromptFromVideo(base64Video, videoFile.type);
      setAudioPrompt(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.unknown'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecommendFilter = async () => {
    if (!videoFile) {
      setError(t('errorUploadVideoFirst'));
      return;
    }
    setIsRecommending(true);
    setError('');
    try {
      const base64Video = await fileToBase64(videoFile);
      const recommended = await recommendVideoFilter(base64Video, videoFile.type);
      setActiveFilter(recommended as FilterType);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.unknown'));
    } finally {
      setIsRecommending(false);
    }
  };
  
  const handleSaveVideo = async () => {
    if (!videoRef.current || !videoFile) return;
    setIsSaving(true);
    setError('');

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setError('Could not get canvas context');
      setIsSaving(false);
      return;
    }

    const canvasStream = canvas.captureStream(30);
    const finalStream = new MediaStream(canvasStream.getVideoTracks());
    let audioContext: AudioContext | null = null;
    let sourceNodeToDisconnect: MediaElementAudioSourceNode | null = null;
    
    const audioSourceElement = (audioUrl && audioRef.current) ? audioRef.current : video;
    
    // FIX: The `audioTracks` property is not available on the `HTMLVideoElement` type in some environments.
    // Casting to `any` allows checking for this and other non-standard properties for robust audio detection.
    const hasAudio = (audioSourceElement instanceof HTMLVideoElement)
      ? ((audioSourceElement as any).mozHasAudio || ((audioSourceElement as any).audioTracks && (audioSourceElement as any).audioTracks.length > 0))
      : true;

    if (hasAudio) {
      try {
        audioContext = new AudioContext();
        const sourceNode = audioContext.createMediaElementSource(audioSourceElement);
        sourceNodeToDisconnect = sourceNode;
        const destination = audioContext.createMediaStreamDestination();
        sourceNode.connect(destination);
        destination.stream.getAudioTracks().forEach(track => finalStream.addTrack(track));
      } catch (e) {
        console.error("Audio processing failed:", e);
        // Continue without audio
      }
    }
    
    const recorder = new MediaRecorder(finalStream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    const onFinish = () => {
        if (recorder.state === 'recording') {
            recorder.stop();
        }
    };
    
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edited-${videoFile.name}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setIsSaving(false);
        video.pause();
        video.currentTime = 0;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        if (sourceNodeToDisconnect) sourceNodeToDisconnect.disconnect();
        if (audioContext) audioContext.close();
        video.removeEventListener('ended', onFinish);
        video.removeEventListener('pause', onFinish);
    };

    video.addEventListener('ended', onFinish);
    video.addEventListener('pause', onFinish);
    recorder.start();

    video.currentTime = 0;
    video.playbackRate = playbackRate;
    if (audioSourceElement) {
        audioSourceElement.currentTime = 0;
        audioSourceElement.playbackRate = playbackRate;
    }

    video.play();
    if (audioUrl && audioRef.current) {
        audioRef.current.play();
    }
    
    const drawFrame = () => {
        if (recorder.state !== 'recording') return;
        ctx.filter = filters.find(f => f.name === activeFilter)?.style || 'none';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
    };
    drawFrame();
  };


  const speedOptions = [0.5, 1, 1.5, 2];
  const filters: { name: FilterType, style: string }[] = [
    { name: 'None', style: 'filter-none' },
    { name: 'Noir', style: 'grayscale(1) contrast(1.1)' },
    { name: 'Vintage', style: 'sepia(0.7) contrast(0.9) brightness(1.1)' },
    { name: 'Vibrant', style: 'saturate(1.5) contrast(1.1)' },
  ];

  const videoFilterStyle = filters.find(f => f.name === activeFilter)?.style || 'none';
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col gap-6">
        <VideoUpload onVideoSelect={setVideoFile} title={t('uploadVideoTitle')} />
        <AudioUpload onAudioSelect={setAudioFile} title={t('uploadAudioTitle')} />
        <div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('visualFilters')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {filters.map(filter => (
              <button
                key={filter.name}
                onClick={() => setActiveFilter(filter.name)}
                disabled={!videoFile || isRecommending || isSaving}
                className={`
                  py-2 px-4 text-sm font-medium rounded-md transition-all
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-purple
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${activeFilter === filter.name ? 'bg-brand-purple text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                `}
              >
                {t(`filter_${filter.name}`)}
              </button>
            ))}
          </div>
          <button
            onClick={handleRecommendFilter}
            disabled={isRecommending || !videoFile || isSaving}
            className="w-full mt-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            {isRecommending ? t('recommendingFilter') : t('recommendFilter')}
          </button>
        </div>
      </div>

      <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col justify-center gap-4">
        <h3 className="text-lg font-semibold text-gray-200">{t('videoPreview')}</h3>
        <div className="w-full aspect-video bg-gray-900 rounded-md border border-gray-700 flex items-center justify-center overflow-hidden">
          {videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                muted={!!audioUrl}
                className="object-contain max-h-full max-w-full rounded-md transition-all duration-300"
                style={{ filter: videoFilterStyle }}
              />
              {audioUrl && <audio ref={audioRef} src={audioUrl} loop />}
            </>
          ) : (
            <div className="text-gray-500">{t('videoPreviewPlaceholder')}</div>
          )}
        </div>
        
        {videoUrl && (
          <div>
            <h4 className="text-md font-semibold text-gray-300 mb-2">{t('playbackSpeed')}</h4>
            <div className="flex space-x-2 rounded-lg bg-gray-900 p-1">
                {speedOptions.map(speed => (
                    <button 
                        key={speed}
                        onClick={() => setPlaybackRate(speed)}
                        disabled={isSaving}
                        className={`
                            flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-purple
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${playbackRate === speed ? 'bg-brand-purple text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                        `}
                    >
                        {speed}x
                    </button>
                ))}
            </div>
          </div>
        )}

        <div className="bg-gray-900 p-4 rounded-md border border-gray-700 min-h-[150px] relative">
           <h3 className="text-lg font-semibold text-gray-200 mb-2 flex justify-between items-center">
             <span>{t('aiSoundPrompt')}</span>
              <button
                onClick={handleGenerateAudioPrompt}
                disabled={isLoading || !videoFile || isRecommending || isSaving}
                className="bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold py-1 px-3 text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t('generating') : t('generateAiSound')}
              </button>
           </h3>
           {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50"><LoadingSpinner message={t('generatingAiSound')} /></div>}
           {error && <div className="text-red-400 p-4">{error}</div>}
           {!isLoading && !error && audioPrompt && (
            <>
             <p className="text-gray-300 whitespace-pre-wrap">{audioPrompt}</p>
             <button 
                onClick={() => navigator.clipboard.writeText(audioPrompt)}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                title={t('copyToClipboard')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </>
           )}
           {!isLoading && !error && !audioPrompt && (
              <div className="text-gray-500 flex items-center justify-center h-full">{t('aiSoundPromptPlaceholder')}</div>
           )}
        </div>
        
        {videoUrl && (
            <button
                onClick={handleSaveVideo}
                disabled={isSaving}
                className="w-full mt-2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-500 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSaving ? (
                     <>
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     {t('savingVideo')}
                     </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {t('saveVideo')}
                    </>
                )}
            </button>
        )}
      </div>
    </div>
  );
};

export default VideoEdit;