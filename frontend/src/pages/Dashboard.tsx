import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, ShoppingCart, Package, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { useToast } from '@/components/ui/use-toast';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const warehouseId = localStorage.getItem('selectedWarehouse');

  const {
    data: lowStock,
    isLoading: lowStockLoading,
    isError: lowStockError,
  } = useQuery({
    queryKey: ['lowStock', warehouseId],
    queryFn: async () => {
      if (!warehouseId) return { count: 0 };
      const res = await api.get(`/api/inventory/alerts/low-stock/?warehouse_id=${warehouseId}`);
      return { count: res.data.length }; // Assuming list response
    },
    enabled: !!warehouseId,
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fetch_error'),
      });
    },
  });

  const {
    data: nearExpiry,
    isLoading: nearExpiryLoading,
    isError: nearExpiryError,
  } = useQuery({
    queryKey: ['nearExpiry', warehouseId],
    queryFn: async () => {
      if (!warehouseId) return { count: 0 };
      const res = await api.get(`/api/inventory/alerts/near-expiry/?warehouse_id=${warehouseId}&days=30`);
      return { count: res.data.length }; // Assuming list response
    },
    enabled: !!warehouseId,
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fetch_error'),
      });
    },
  });

  const shortcuts = [
    { label: t('pos'), icon: ShoppingCart, to: '/pos', color: 'text-blue-500' },
    { label: t('products'), icon: Package, to: '/products', color: 'text-green-500' },
    { label: t('purchasing'), icon: Truck, to: '/purchasing', color: 'text-orange-500' },
  ];

  const renderKpiValue = (loading: boolean, count?: number, isError?: boolean) => {
    if (!warehouseId) {
      return <span className="text-sm text-muted-foreground">{t('select_warehouse')}</span>;
    }

    if (loading) {
      return <span className="text-sm text-muted-foreground">{t('loading')}</span>;
    }

    if (isError) {
      return <span className="text-sm text-destructive">{t('error')}</span>;
    }

    return (
      <div className="space-y-1">
        <div className="text-2xl font-bold">{count ?? 0}</div>
        {(count ?? 0) === 0 && (
          <div className="text-xs text-muted-foreground">{t('no_data')}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('dashboard')}</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('low_stock')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {renderKpiValue(lowStockLoading, lowStock?.count, lowStockError)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('near_expiry')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {renderKpiValue(nearExpiryLoading, nearExpiry?.count, nearExpiryError)}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('quick_actions')}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {shortcuts.map((item) => (
          <Card 
            key={item.to} 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => navigate(item.to)}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
              <div className={`p-3 rounded-full bg-background border shadow-sm ${item.color}`}>
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="font-semibold">{item.label}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
