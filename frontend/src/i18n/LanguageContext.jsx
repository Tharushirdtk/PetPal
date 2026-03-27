import { createContext, useContext, useState } from 'react';
import { translations } from './translations';

const LangContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState('en');

  const setLang = (l) => {
    setLangState(l);
    document.documentElement.lang = l;
  };

  const t = (key) => translations[lang][key] || key;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be inside LanguageProvider');
  return ctx;
};
