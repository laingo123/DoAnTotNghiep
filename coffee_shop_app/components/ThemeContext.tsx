import React, { createContext, useContext, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  headerBg: string;
  tabBarBg: string;
  tabBarBorder: string;
  inputBg: string;
  statusBarStyle: 'light-content' | 'dark-content';
}

const lightTheme: ThemeColors = {
  background: '#F9F9F9',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#242424',
  textSecondary: '#A2A2A2',
  border: '#E0E0E0',
  headerBg: '#222222',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E0E0E0',
  inputBg: '#2A2A2A',
  statusBarStyle: 'light-content',
};

const darkTheme: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2A2A2A',
  text: '#EEEEEE',
  textSecondary: '#888888',
  border: '#333333',
  headerBg: '#0A0A0A',
  tabBarBg: '#1A1A1A',
  tabBarBorder: '#333333',
  inputBg: '#333333',
  statusBarStyle: 'light-content',
};

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  colors: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  const toggleTheme = () => {
    setMode(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const colors = mode === 'light' ? lightTheme : darkTheme;
  const isDark = mode === 'dark';

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
