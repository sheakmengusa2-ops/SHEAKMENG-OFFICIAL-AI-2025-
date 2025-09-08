import React from 'react';
import { useTranslations } from '../i18n/TranslationContext';
import { locales, Locale } from '../i18n/locales';

const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale } = useTranslations();

  return (
    <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
      {(Object.keys(locales) as Locale[]).map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          className={`
            px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-brand-purple
            ${
              locale === loc
                ? 'bg-brand-purple text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }
          `}
        >
          {locales[loc]}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
