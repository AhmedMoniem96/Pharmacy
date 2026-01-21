import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Typography variant="h1" color="primary">
        404
      </Typography>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('not_found')}
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')}>
        Back Home
      </Button>
    </Box>
  );
}