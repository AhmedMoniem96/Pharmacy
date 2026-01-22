import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useBranchWarehouse } from '@/context/BranchWarehouseContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, Globe, LogOut, User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export const Topbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { branches, warehouses, selectedBranch, selectedWarehouse, setSelectedBranch, setSelectedWarehouse } =
    useBranchWarehouse();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        {/* Branch Selector */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">
            {t('branch')}:
          </span>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('select_branch')} />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Warehouse Selector */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">
            {t('warehouse')}:
          </span>
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('select_warehouse')} />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        <Button variant="ghost" size="icon" onClick={toggleLanguage}>
          <Globe className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Sun className="h-4 w-4 text-muted-foreground" />
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
            aria-label={t('toggle_theme')}
          />
          <Moon className="h-4 w-4 text-muted-foreground" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="space-x-2 rtl:space-x-reverse">
              <User className="h-5 w-5" />
              <span className="hidden md:inline-block">{user?.username}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
