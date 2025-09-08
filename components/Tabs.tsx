
import React from 'react';
import { FeatureTab } from '../types';
import { useTranslations } from '../i18n/TranslationContext';

interface TabsProps {
  activeTab: FeatureTab;
  setActiveTab: (tab: FeatureTab) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslations();
  const tabs = Object.values(FeatureTab);

  const tabTranslations: { [key in FeatureTab]: string } = {
    [FeatureTab.ImageToPrompt]: t('tabImageToPrompt'),
    [FeatureTab.PromptToImage]: t('tabPromptToImage'),
    [FeatureTab.ImageToVideo]: t('tabImageToVideo'),
    [FeatureTab.VideoToPrompt]: t('tabVideoToPrompt'),
    [FeatureTab.VideoEdit]: t('tabVideoEdit'),
    [FeatureTab.SpeakingPhoto]: t('tabSpeakingPhoto'),
  }

  return (
    <div className="flex justify-center border-b border-gray-700">
      <nav className="flex space-x-2 sm:space-x-4" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-3 sm:px-6 py-3 font-medium text-sm sm:text-base rounded-t-lg transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-brand-purple
              ${
                activeTab === tab
                  ? 'border-b-2 border-brand-purple text-white bg-gray-800'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }
            `}
          >
            {tabTranslations[tab]}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Tabs;