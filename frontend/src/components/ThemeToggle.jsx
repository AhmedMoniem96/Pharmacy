import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeContext } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function ThemeToggle() {
  const { toggleColorMode, mode } = useThemeContext();
  const { t } = useTranslation();

  return (
    <Tooltip title={mode === 'dark' ? t('light_mode') : t('dark_mode')}>
      <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
}