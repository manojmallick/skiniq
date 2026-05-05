import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    // Auto-detect browser language
    const browserLang = navigator.language.split('-')[0];
    if (translations[browserLang]) {
      setLocale(browserLang);
    }
  }, []);

  const t = (key) => {
    if (!translations[locale] || !translations[locale][key]) {
      // Fallback to English if key is missing in chosen locale
      return translations['en']?.[key] || key;
    }
    return translations[locale][key];
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, languages: translations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
