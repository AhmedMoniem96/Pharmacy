import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  company_name: string;
}

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>();

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await api.post('/auth/register/', data);
      toast({
        title: t('success'),
        description: t('success_register'),
      });
      navigate('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('error_register'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-10 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="hidden flex-col justify-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-10 text-white shadow-2xl backdrop-blur-xl lg:flex">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.4em] text-white/60">{t('welcome')}</p>
              <h1 className="text-4xl font-semibold leading-tight">
                Elevate your pharmacy operations with a refined, secure workspace.
              </h1>
              <p className="text-white/70">
                Create your account to unlock premium dashboards, real-time inventory insights, and
                elegant checkout flows built for growth.
              </p>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Luxury analytics and tailored workflows from day one.</span>
            </div>
          </div>

          <Card className="w-full max-w-xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-3xl font-semibold text-white">{t('register')}</CardTitle>
              <p className="text-sm text-white/70">
                Craft your premium workspace in a few elegant steps.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-white/80">
                    {t('company_name')}
                  </Label>
                  <Input
                    id="company_name"
                    {...register('company_name', { required: true })}
                    placeholder={t('company_name')}
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
                  />
                  {errors.company_name && (
                    <span className="text-xs text-amber-200">{t('field_required')}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white/80">
                    {t('username')}
                  </Label>
                  <Input
                    id="username"
                    {...register('username', { required: true })}
                    placeholder={t('username')}
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
                  />
                  {errors.username && (
                    <span className="text-xs text-amber-200">{t('field_required')}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">
                    {t('email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email', { required: true })}
                    placeholder={t('email')}
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
                  />
                  {errors.email && (
                    <span className="text-xs text-amber-200">{t('field_required')}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">
                    {t('password')}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password', { required: true })}
                    placeholder={t('password')}
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
                  />
                  {errors.password && (
                    <span className="text-xs text-amber-200">{t('field_required')}</span>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 hover:from-amber-300 hover:via-amber-400 hover:to-yellow-400"
                  disabled={isLoading}
                >
                  {isLoading ? t('loading') : t('register')}
                </Button>
              </form>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/70">
                <span>Already have an account?</span>
                <Link to="/login" className="font-semibold text-amber-300 hover:text-amber-200">
                  {t('sign_in')}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
