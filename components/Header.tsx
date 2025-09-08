import React from 'react';
import { useTranslations } from '../i18n/TranslationContext';
import LanguageSwitcher from './LanguageSwitcher';

const Header: React.FC = () => {
  const { t } = useTranslations();

  return (
    <header className="text-center mb-8 md:mb-12 relative">
      <div className="absolute top-0 right-0 z-10">
        <LanguageSwitcher />
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
        <span className="bg-gradient-to-r from-brand-purple to-brand-pink text-transparent bg-clip-text">
          {t('headerTitle')}
        </span>
      </h1>
      <p className="mt-3 text-lg text-gray-400">{t('headerSubtitle')}</p>
    </header>
  );
};

export default Header;