import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import en from '../locales/en';
import vi from '../locales/vi';

type Language = 'en' | 'vi';
type TranslationKeys = keyof typeof en;

interface LanguageContextType {
  language: Language;
  t: (key: TranslationKeys) => string;
  toggleLanguage: () => void;
}

const translations = { en, vi };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback(
    (key: TranslationKeys): string => {
      return translations[language][key] || key;
    },
    [language]
  );

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'en' ? 'vi' : 'en'));
  }, []);

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
