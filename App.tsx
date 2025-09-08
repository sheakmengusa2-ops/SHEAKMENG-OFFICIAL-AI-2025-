
import React, { useState, useCallback } from 'react';
import { FeatureTab } from './types';
import Header from './components/Header';
import Tabs from './components/Tabs';
import ImageToPrompt from './components/ImageToPrompt';
import PromptToImage from './components/PromptToImage';
import ImageToVideo from './components/ImageToVideo';
import VideoToPrompt from './components/VideoToPrompt';
import VideoEdit from './components/VideoEdit';
import SpeakingPhoto from './components/ImageToVeo3';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FeatureTab>(FeatureTab.ImageToPrompt);

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case FeatureTab.ImageToPrompt:
        return <ImageToPrompt />;
      case FeatureTab.PromptToImage:
        return <PromptToImage />;
      case FeatureTab.ImageToVideo:
        return <ImageToVideo />;
      case FeatureTab.VideoToPrompt:
        return <VideoToPrompt />;
      case FeatureTab.VideoEdit:
        return <VideoEdit />;
      case FeatureTab.SpeakingPhoto:
        return <SpeakingPhoto />;
      default:
        return <ImageToPrompt />;
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <div className="container mx-auto px-4 py-8">
        <Header />
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="mt-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;