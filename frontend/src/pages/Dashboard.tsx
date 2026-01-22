import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  AlertTriangle,
  CreditCard,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  ShoppingCart,
  Package,
  Truck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '@/api/axios';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{t('welcome')}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t('dashboard')}</h1>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Branch</label>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm">
              <option>All branches</option>
              <option>Main branch</option>
              <option>Community clinic</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Warehouse</label>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm">
              <option>All warehouses</option>
              <option>Central storage</option>
              <option>North hub</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="mt-1 flex items-center text-xs text-emerald-500">
              <TrendingUp className="mr-1 h-3 w-3" /> +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
            <p className="mt-1 flex items-center text-xs text-emerald-500">
              <TrendingUp className="mr-1 h-3 w-3" /> +180.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12,234</div>
            <p className="mt-1 flex items-center text-xs text-emerald-500">
              <TrendingUp className="mr-1 h-3 w-3" /> +19% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="mt-1 text-xs text-muted-foreground">+201 since last hour</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
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
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentSales.map((sale) => (
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
                  <p className="text-sm text-muted-foreground">Loading low stock alerts...</p>
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
