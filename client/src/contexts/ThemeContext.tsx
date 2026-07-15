import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// @ts-ignore
import { configManager } from '../game/utils/ConfigManager';

export type Theme = 'light' | 'dark' | 'light2' | 'dark2';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (configManager.get('theme') as Theme) || 'dark';
  });

  const setTheme = (newTheme: Theme) => {
    console.log(`[ThemeContext] Theme changed to: ${newTheme}`);
    setThemeState(newTheme);
    configManager.set('theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'light2' : theme === 'light2' ? 'dark' : theme === 'dark' ? 'dark2' : 'light');
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'light2', 'dark2');
    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
