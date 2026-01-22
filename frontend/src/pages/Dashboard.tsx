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
    { label: t('new_sale'), icon: ShoppingCart, to: '/pos', color: 'text-blue-500' },
    { label: t('add_product'), icon: Package, to: '/products', color: 'text-green-500' },
    { label: t('receive_stock'), icon: Truck, to: '/purchasing', color: 'text-orange-500' },
  ];

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
            <div className="text-2xl font-bold">
              {isLowStockLoading ? '...' : lowStockData?.length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('near_expiry')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isNearExpiryLoading ? '...' : nearExpiryData?.length ?? 0}
            </div>
          </CardContent>
        </Card>
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