import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslation from './locales/en/translation.json';
import itTranslation from './locales/it/translation.json';
import enAudit from './locales/en/audit.json';
import itAudit from './locales/it/audit.json';
import enReport from './locales/en/report.json';
import itReport from './locales/it/report.json';

const resources = {
  en: {
    translation: enTranslation,
    audit: enAudit,
    report: enReport,
  },
  it: {
    translation: itTranslation,
    audit: itAudit,
    report: itReport,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;