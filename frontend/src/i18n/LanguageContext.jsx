import React, { createContext, useState, useContext, useEffect } from 'react';
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

const translations = {
  en,
  hi,
  mr
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('appLanguage') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  return useContext(LanguageContext);
};
