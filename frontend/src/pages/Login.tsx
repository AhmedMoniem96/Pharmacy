import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/token/', data);
      login(response.data.access, response.data.refresh);
      toast({
        title: t('success'),
        description: t('login_success'),
      });
      navigate('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('login_failed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            {t('app_name')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('username')}</Label>
              <Input
                id="username"
                {...register('username', { required: true })}
                placeholder={t('username')}
              />
              {errors.username && (
                <span className="text-xs text-destructive">{t('field_required')}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                {...register('password', { required: true })}
                placeholder={t('password')}
              />
              {errors.password && (
                <span className="text-xs text-destructive">{t('field_required')}</span>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('loading') : t('sign_in')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};