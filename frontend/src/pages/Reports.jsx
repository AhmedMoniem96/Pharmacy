import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function Reports() {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography variant="h4">{t('reports')}</Typography>
      <Typography>Reports module coming soon...</Typography>
    </Box>
  );
}