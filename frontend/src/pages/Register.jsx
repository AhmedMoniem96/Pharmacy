import React, { useState } from 'react';
import { Container, Box, TextField, Button, Typography, Alert, Paper, Link, Grid } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    company_name: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register/', formData);
      navigate('/login', { state: { message: t('success_register') } });
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
          setError(JSON.stringify(err.response.data));
      } else {
          setError(t('error_register'));
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #004d40 0%, #00251a 100%)',
        py: 4,
        position: 'relative'
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
        <ThemeToggle />
        <LanguageSwitcher />
      </Box>

      <Container maxWidth="sm">
        <Paper elevation={12} sx={{ p: 4, borderRadius: 4, backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="h1" variant="h4" color="primary" gutterBottom fontWeight="bold">
              {t('create_account')}
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              Start managing your pharmacy today
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label={t('company_name')}
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label={t('username')}
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label={t('email')}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label={t('password')}
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 4, mb: 2, py: 1.5, fontSize: '1.1rem' }}
              >
                {t('register')}
              </Button>
              <Grid container justify="flex-end">
                <Grid item>
                  <Link component={RouterLink} to="/login" variant="body2">
                    {t('already_have_account')} {t('sign_in')}
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}