import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { translations, SupportedLanguage } from '../constants/translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en'); // Default to English
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load language preference from storage
    const loadLanguage = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('appLanguage');
        if (storedLang && ['en', 'fr', 'ar'].includes(storedLang)) {
          setLanguageState(storedLang as SupportedLanguage);
          
          // Basic RTL handling (requires app reload on actual native devices, but good to track)
          const isRTL = storedLang === 'ar';
          if (I18nManager.isRTL !== isRTL) {
            I18nManager.allowRTL(isRTL);
            I18nManager.forceRTL(isRTL);
          }
        }
      } catch (e) {
        console.error('Failed to load language', e);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadLanguage();
  }, []);

  const setLanguage = async (lang: SupportedLanguage) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem('appLanguage', lang);
      
      // Update RTL setting if switching to/from Arabic
      const isRTL = lang === 'ar';
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
        // Note: For full RTL support to take effect, the app usually needs to be restarted.
      }
    } catch (e) {
      console.error('Failed to save language', e);
    }
  };

  const t = (key: string): string => {
    const langDict = translations[language];
    return langDict[key] || key;
  };

  if (!isLoaded) return null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL: language === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
