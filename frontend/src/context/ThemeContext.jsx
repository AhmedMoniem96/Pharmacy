import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { getTheme } from '../theme';
import { useTranslation } from 'react-i18next';

const ThemeContext = createContext();

export const useThemeContext = () => useContext(ThemeContext);

// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const cacheLtr = createCache({
  key: 'muiltr',
});

export const ThemeContextProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');
  const [direction, setDirection] = useState(i18n.language === 'ar' ? 'rtl' : 'ltr');

  useEffect(() => {
    setDirection(i18n.language === 'ar' ? 'rtl' : 'ltr');
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const theme = useMemo(() => getTheme(mode, direction), [mode, direction]);

  return (
    <ThemeContext.Provider value={{ toggleColorMode, mode, direction }}>
      <CacheProvider value={direction === 'rtl' ? cacheRtl : cacheLtr}>
        <MuiThemeProvider theme={theme}>
          {children}
        </MuiThemeProvider>
      </CacheProvider>
    </ThemeContext.Provider>
  );
};