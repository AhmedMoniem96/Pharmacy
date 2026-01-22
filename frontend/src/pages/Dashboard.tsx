import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  AlertTriangle,
  CreditCard,
  DollarSign,
  ShoppingBag,
  ShoppingCart,
  Package,
  Truck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '@/api/axios';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { KpiCard } from './dashboard/KpiCard';

const overviewData = [
  { name: 'Mon', total: 1200 },
  { name: 'Tue', total: 1800 },
  { name: 'Wed', total: 2200 },
  { name: 'Thu', total: 1600 },
  { name: 'Fri', total: 2800 },
  { name: 'Sat', total: 1900 },
  { name: 'Sun', total: 2400 },
];

const recentSales = [
  { name: 'Ahmed Moniem', email: 'ahmed@example.com', amount: '+$1,999.00' },
  { name: 'Sarah Smith', email: 'sarah@example.com', amount: '+$39.00' },
  { name: 'John Doe', email: 'john@example.com', amount: '+$299.00' },
  { name: 'Isabella Nguyen', email: 'isabella@example.com', amount: '+$99.00' },
];

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
    { label: t('new_sale'), icon: ShoppingCart, to: '/pos', color: 'bg-sky-500/10 text-sky-500' },
    { label: t('add_product'), icon: Package, to: '/products', color: 'bg-emerald-500/10 text-emerald-500' },
    { label: t('receive_stock'), icon: Truck, to: '/purchasing', color: 'bg-amber-500/10 text-amber-500' },
  ];
  const isDashboardLoading = isLowStockLoading || isNearExpiryLoading;
  const recentSalesSkeletons = Array.from({ length: 4 });
  const lowStockSkeletons = Array.from({ length: 3 });

  return (
    <div className="space-y-6">
      <DashboardHeader />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value="$45,231.89"
          change="+20.1%"
          trend="up"
          icon={DollarSign}
          helperText="from last month"
          isLoading={isDashboardLoading}
        />
        <KpiCard
          title="Active Orders"
          value="+2350"
          change="+180.1%"
          trend="up"
          icon={ShoppingBag}
          helperText="from last month"
          isLoading={isDashboardLoading}
        />
        <KpiCard
          title="Sales"
          value="+12,234"
          change="+19%"
          trend="up"
          icon={CreditCard}
          helperText="from last month"
          isLoading={isDashboardLoading}
        />
        <KpiCard
          title="Active Now"
          value="+573"
          change="+201"
          trend="up"
          icon={Activity}
          helperText="since last hour"
          isLoading={isDashboardLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {isDashboardLoading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={overviewData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isDashboardLoading
                  ? recentSalesSkeletons.map((_, index) => (
                      <div key={`recent-sales-skeleton-${index}`} className="flex items-center gap-4">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))
                  : recentSales.map((sale) => (
                      <div key={sale.email} className="flex items-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                          <span className="text-sm font-semibold">{sale.name[0]}</span>
                        </div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none text-foreground">{sale.name}</p>
                          <p className="text-sm text-muted-foreground">{sale.email}</p>
                        </div>
                        <div className="ml-auto text-sm font-medium text-foreground">{sale.amount}</div>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Low Stock Alerts
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {isNearExpiryLoading ? '...' : nearExpiryData?.length ?? 0} near expiry
              </span>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLowStockLoading ? (
                  lowStockSkeletons.map((_, index) => (
                    <div key={`low-stock-skeleton-${index}`} className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  ))
                ) : lowStockData?.length ? (
                  lowStockData.slice(0, 4).map((item: { id?: number; name?: string; stock?: number; min?: number }) => (
                    <div
                      key={item.id ?? item.name}
                      className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name ?? 'Unnamed item'}</p>
                        <p className="text-xs text-destructive">
                          Only {item.stock ?? 0} left (Min: {item.min ?? '--'})
                        </p>
                      </div>
                      <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                        Restock
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No low stock alerts available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map((item) => (
            <button
              key={item.to}
              className="flex items-center gap-4 rounded-lg border border-border/60 bg-background p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => navigate(item.to)}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-full ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">Tap to begin instantly.</p>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
