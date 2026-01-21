import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function Accounting() {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography variant="h4">{t('accounting')}</Typography>
      <Typography>Accounting module coming soon...</Typography>
    </Box>
  );
}