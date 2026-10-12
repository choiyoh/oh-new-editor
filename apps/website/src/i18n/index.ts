import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enHero from './locales/en/hero.json';
import enFeatures from './locales/en/features.json';
import enPackages from './locales/en/packages.json';
import enDemo from './locales/en/demo.json';

import koCommon from './locales/ko/common.json';
import koHero from './locales/ko/hero.json';
import koFeatures from './locales/ko/features.json';
import koPackages from './locales/ko/packages.json';
import koDemo from './locales/ko/demo.json';

import zhCommon from './locales/zh-CN/common.json';
import zhHero from './locales/zh-CN/hero.json';
import zhFeatures from './locales/zh-CN/features.json';
import zhPackages from './locales/zh-CN/packages.json';
import zhDemo from './locales/zh-CN/demo.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        hero: enHero,
        features: enFeatures,
        packages: enPackages,
        demo: enDemo,
      },
      ko: {
        common: koCommon,
        hero: koHero,
        features: koFeatures,
        packages: koPackages,
        demo: koDemo,
      },
      'zh-CN': {
        common: zhCommon,
        hero: zhHero,
        features: zhFeatures,
        packages: zhPackages,
        demo: zhDemo,
      },
    },
    fallbackLng: 'en',
    // Map browser locales like ko-KR onto the bundled languages.
    supportedLngs: ['en', 'ko', 'zh-CN'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Keep <html lang>, the title and the description in sync with the language.
function syncDocumentLanguage(lng: string) {
  document.documentElement.lang = lng;
  if (!window.location.pathname.startsWith('/docs')) {
    document.title = i18n.t('meta.title', { ns: 'common' });
  }
  document.querySelector('meta[name="description"]')?.setAttribute('content', i18n.t('meta.description', { ns: 'common' }));
}

i18n.on('languageChanged', syncDocumentLanguage);
if (i18n.isInitialized) syncDocumentLanguage(i18n.language);
else i18n.on('initialized', () => syncDocumentLanguage(i18n.language));

export default i18n;
