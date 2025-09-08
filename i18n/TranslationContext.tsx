import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { locales, defaultLocale, Locale } from './locales';
import { translations } from './translations';

type TranslationContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: { [key: string]: string | number }) => string;
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  const t = useCallback((key: string, params?: { [key: string]: string | number }) => {
    let text = translations[locale][key as keyof typeof translations[Locale]] || translations[defaultLocale][key as keyof typeof translations[Locale]] || key;
    if (params) {
      Object.keys(params).forEach(paramKey => {
        text = text.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }
    return text;
  }, [locale]);

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslations = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslations must be used within a TranslationProvider');
  }
  return context;
};
