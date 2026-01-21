import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  FileText,
  Settings,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/pos', icon: ShoppingCart, label: t('pos') },
    { to: '/products', icon: Package, label: t('products') },
    { to: '/purchasing', icon: Truck, label: t('purchasing') },
    { to: '/reports', icon: FileText, label: t('reports') },
    { to: '/accounting', icon: Calculator, label: t('accounting'), disabled: true },
    { to: '/settings', icon: Settings, label: t('settings') },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col sticky top-0">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">{t('app_name')}</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
              )
            }
            onClick={(e) => item.disabled && e.preventDefault()}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
            {item.disabled && (
              <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">
                {t('coming_soon')}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          v1.0.0
        </div>
      </div>
    </aside>
  );
};