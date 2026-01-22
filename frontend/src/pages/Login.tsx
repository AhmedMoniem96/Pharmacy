import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-8 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_1.05fr]">
          <Card className="w-full border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-3xl font-semibold text-white">{t('app_name')}</CardTitle>
              <p className="text-sm text-white/70">{t('welcome')} back to your luxury workspace.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  {isLoading ? t('loading') : t('sign_in')}
                </Button>
              </form>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/70">
                <span>New here?</span>
                <Link to="/register" className="font-semibold text-amber-300 hover:text-amber-200">
                  {t('register')}
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="hidden flex-col justify-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-10 text-white shadow-2xl backdrop-blur-xl lg:flex">
            <p className="text-sm uppercase tracking-[0.4em] text-white/60">{t('dashboard')}</p>
            <h1 className="text-4xl font-semibold leading-tight">
              Premium analytics, curated inventory, and seamless workflows.
            </h1>
            <p className="text-white/70">
              Sign in to explore tailored dashboards, streamlined purchasing, and effortless
              compliance reporting—all wrapped in a refined interface.
            </p>
            <div className="flex items-center gap-3 text-white/70">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Trusted by teams that expect brilliance.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
