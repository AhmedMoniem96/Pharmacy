import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function Products() {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography variant="h4">{t('products')}</Typography>
      <Typography>Product management coming soon...</Typography>
    </Box>
  );
}