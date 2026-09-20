import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';

type ThemeType = 'light' | 'dark';

interface ThemeContextData {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: typeof Colors.light;
}

const ThemeContext = createContext<ThemeContextData>({
  theme: 'dark',
  setTheme: () => {},
  colors: Colors.dark,
});

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeType>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load saved theme on startup
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@app_theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeState(savedTheme);
        }
      } catch (e) {
        console.error('Failed to load theme:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('@app_theme', newTheme);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  };

  if (!isLoaded) return null; // or a splash screen

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: Colors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
