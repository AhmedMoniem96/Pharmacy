import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, Globe, LogOut, User } from 'lucide-react';
import api from '@/api/axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Branch {
  id: number;
  name: string;
}

interface Warehouse {
  id: number;
  name: string;
}

export const Topbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(
    localStorage.getItem('selectedBranch') || ''
  );
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(
    localStorage.getItem('selectedWarehouse') || ''
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real scenario, we might want to fetch all available branches/warehouses
        // or rely on what's in the user object if it's scoped.
        // For MVP, let's assume user object has allowed lists, or we fetch from masterdata if user is admin.
        // Here we'll try to use the user's allowed lists first.
        
        if (user?.allowed_branches?.length) {
          setBranches(user.allowed_branches);
          if (!selectedBranch) setSelectedBranch(String(user.allowed_branches[0].id));
        } else {
           // Fallback fetch if user object doesn't have them populated or for admins
           const { data } = await api.get('/masterdata/branches/');
           setBranches(data.results || data);
           if (!selectedBranch && data.length > 0) setSelectedBranch(String(data[0].id));
        }

        if (user?.allowed_warehouses?.length) {
          setWarehouses(user.allowed_warehouses);
          if (!selectedWarehouse) setSelectedWarehouse(String(user.allowed_warehouses[0].id));
        } else {
            const { data } = await api.get('/masterdata/warehouses/');
            setWarehouses(data.results || data);
            if (!selectedWarehouse && data.length > 0) setSelectedWarehouse(String(data[0].id));
        }

      } catch (error) {
        console.error('Failed to fetch branches/warehouses', error);
      }
    };
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    if (selectedBranch) localStorage.setItem('selectedBranch', selectedBranch);
    if (selectedWarehouse) localStorage.setItem('selectedWarehouse', selectedWarehouse);
  }, [selectedBranch, selectedWarehouse]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* Branch Selector */}
        <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-2">
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

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleLanguage}>
          <Globe className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <User className="h-5 w-5" />
              <span className="hidden md:inline-block">{user?.username}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};