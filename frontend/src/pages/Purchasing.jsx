import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function Purchasing() {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography variant="h4">{t('purchasing')}</Typography>
      <Typography>Purchasing module coming soon...</Typography>
    </Box>
  );
}