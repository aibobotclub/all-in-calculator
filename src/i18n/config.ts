import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import zhTranslations from './locales/zh.json';

// 默认使用英文
const defaultLanguage = 'en';
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('language') || defaultLanguage : defaultLanguage;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      zh: {
        translation: zhTranslations
      }
    },
    lng: savedLanguage,
    fallbackLng: defaultLanguage,
    interpolation: {
      escapeValue: false
    }
  });

export const changeLanguage = (lng: 'en' | 'zh') => {
  i18n.changeLanguage(lng);
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lng);
  }
};

export default i18n; 