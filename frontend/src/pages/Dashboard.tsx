import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, ShoppingCart, Package, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const warehouseId = localStorage.getItem('selectedWarehouse');

  const { data: lowStockData, isLoading: isLowStockLoading } = useQuery({
    queryKey: ['lowStockAlerts', warehouseId],
    queryFn: async () => {
      const { data } = await api.get(`/inventory/alerts/low-stock/?warehouse_id=${warehouseId}`);
      return data;
    },
    enabled: !!warehouseId,
  });

  const { data: nearExpiryData, isLoading: isNearExpiryLoading } = useQuery({
    queryKey: ['nearExpiryAlerts', warehouseId],
    queryFn: async () => {
      const { data } = await api.get(`/inventory/alerts/near-expiry/?warehouse_id=${warehouseId}&days=30`);
      return data;
    },
    enabled: !!warehouseId,
  });

  const shortcuts = [
    { label: t('new_sale'), icon: ShoppingCart, to: '/pos', color: 'from-sky-500/20 to-blue-500/10' },
    { label: t('add_product'), icon: Package, to: '/products', color: 'from-emerald-500/20 to-green-500/10' },
    { label: t('receive_stock'), icon: Truck, to: '/purchasing', color: 'from-amber-500/20 to-orange-500/10' },
  ];

  return (
    <div className="space-y-8">
      <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        </div>
        <CardContent className="relative z-10 flex flex-col gap-4 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-white/60">{t('welcome')}</p>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{t('dashboard')}</h1>
            <p className="max-w-2xl text-white/70">
              Curate your daily focus with elegant insights, real-time safeguards, and quick actions
              crafted for premium pharmacy operations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70">
              Inventory intelligence
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70">
              Luxe sales flow
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70">
              Compliance ready
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border border-white/10 bg-white/60 shadow-lg backdrop-blur dark:bg-slate-900/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('low_stock')}</CardTitle>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-destructive">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-semibold">
              {isLowStockLoading ? '...' : lowStockData?.length ?? 0}
            </div>
            <p className="text-sm text-muted-foreground">Critical stock items to review today.</p>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-white/60 shadow-lg backdrop-blur dark:bg-slate-900/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('near_expiry')}</CardTitle>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/15 text-amber-500">
              <Clock className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-semibold">
              {isNearExpiryLoading ? '...' : nearExpiryData?.length ?? 0}
            </div>
            <p className="text-sm text-muted-foreground">Items nearing expiry in the next 30 days.</p>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-gradient-to-br from-amber-500/10 via-transparent to-indigo-500/10 shadow-lg backdrop-blur">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-sm font-medium">Luxury overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tailor every shift with curated insights, plush visuals, and streamlined access to your
              most-used tools.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-amber-500">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Premium-ready workflows
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {shortcuts.map((item) => (
          <Card
            key={item.to}
            className="group cursor-pointer overflow-hidden border border-white/10 bg-white/70 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl dark:bg-slate-900/60"
            onClick={() => navigate(item.to)}
          >
            <CardContent className="relative flex flex-col items-center justify-center gap-4 p-6">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 transition-opacity group-hover:opacity-100`}
              />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/80 text-slate-900 shadow-md">
                <item.icon className="h-7 w-7" />
              </div>
              <h3 className="relative text-base font-semibold">{item.label}</h3>
              <p className="relative text-xs text-muted-foreground">Tap to begin instantly.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
