export const locales = {
  en: 'English',
  km: 'ខ្មែរ',
};

export type Locale = keyof typeof locales;

export const defaultLocale: Locale = 'en';
