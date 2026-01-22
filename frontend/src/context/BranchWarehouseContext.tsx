import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

type Branch = {
  id: number;
  name: string;
};

type Warehouse = {
  id: number;
  name: string;
};

type BranchWarehouseShortcut = {
  branchId: string;
  warehouseId: string;
  branchName: string;
  warehouseName: string;
};

type BranchWarehouseContextValue = {
  branches: Branch[];
  warehouses: Warehouse[];
  selectedBranch: string;
  selectedWarehouse: string;
  setSelectedBranch: React.Dispatch<React.SetStateAction<string>>;
  setSelectedWarehouse: React.Dispatch<React.SetStateAction<string>>;
  shortcuts: BranchWarehouseShortcut[];
};

const SHORTCUTS_STORAGE_KEY = 'branchWarehouseShortcuts';

const BranchWarehouseContext = createContext<BranchWarehouseContextValue | undefined>(undefined);

const parseShortcutsFromStorage = (): BranchWarehouseShortcut[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const storedValue = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
  if (!storedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is BranchWarehouseShortcut =>
        item &&
        typeof item.branchId === 'string' &&
        typeof item.warehouseId === 'string' &&
        typeof item.branchName === 'string' &&
        typeof item.warehouseName === 'string'
    );
  } catch (error) {
    return [];
  }
};

export const BranchWarehouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(
    localStorage.getItem('selectedBranch') || ''
  );
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(
    localStorage.getItem('selectedWarehouse') || ''
  );
  const [shortcuts, setShortcuts] = useState<BranchWarehouseShortcut[]>(parseShortcutsFromStorage);

  useEffect(() => {
    if (!user) return;

    const allowedBranches = user.allowed_branches ?? [];
    const allowedWarehouses = user.allowed_warehouses ?? [];

    setBranches(allowedBranches);
    setWarehouses(allowedWarehouses);

    const nextBranch = (() => {
      const isValid = allowedBranches.some((branch: Branch) => String(branch.id) === selectedBranch);
      if (selectedBranch && !isValid) {
        toast({
          variant: 'destructive',
          title: t('error'),
          description: 'Selected branch is no longer available.',
        });
        return allowedBranches.length ? String(allowedBranches[0].id) : '';
      }
      if (!selectedBranch && allowedBranches.length) {
        return String(allowedBranches[0].id);
      }
      return selectedBranch;
    })();

    const nextWarehouse = (() => {
      const isValid = allowedWarehouses.some(
        (warehouse: Warehouse) => String(warehouse.id) === selectedWarehouse
      );
      if (selectedWarehouse && !isValid) {
        toast({
          variant: 'destructive',
          title: t('error'),
          description: 'Selected warehouse is no longer available.',
        });
        return allowedWarehouses.length ? String(allowedWarehouses[0].id) : '';
      }
      if (!selectedWarehouse && allowedWarehouses.length) {
        return String(allowedWarehouses[0].id);
      }
      return selectedWarehouse;
    })();

    setSelectedBranch(nextBranch);
    setSelectedWarehouse(nextWarehouse);
  }, [user, selectedBranch, selectedWarehouse, t, toast]);

  useEffect(() => {
    if (selectedBranch) {
      localStorage.setItem('selectedBranch', selectedBranch);
    } else {
      localStorage.removeItem('selectedBranch');
    }

    if (selectedWarehouse) {
      localStorage.setItem('selectedWarehouse', selectedWarehouse);
    } else {
      localStorage.removeItem('selectedWarehouse');
    }
  }, [selectedBranch, selectedWarehouse]);

  useEffect(() => {
    if (!selectedBranch || !selectedWarehouse) {
      return;
    }

    const branch = branches.find((item) => String(item.id) === selectedBranch);
    const warehouse = warehouses.find((item) => String(item.id) === selectedWarehouse);

    if (!branch || !warehouse) {
      return;
    }

    setShortcuts((previous) => {
      const nextShortcuts = [
        {
          branchId: selectedBranch,
          warehouseId: selectedWarehouse,
          branchName: branch.name,
          warehouseName: warehouse.name,
        },
        ...previous.filter(
          (combo) => combo.branchId !== selectedBranch || combo.warehouseId !== selectedWarehouse
        ),
      ].slice(0, 4);

      localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(nextShortcuts));
      return nextShortcuts;
    });
  }, [branches, selectedBranch, selectedWarehouse, warehouses]);

  const value = useMemo(
    () => ({
      branches,
      warehouses,
      selectedBranch,
      selectedWarehouse,
      setSelectedBranch,
      setSelectedWarehouse,
      shortcuts,
    }),
    [branches, warehouses, selectedBranch, selectedWarehouse, shortcuts]
  );

  return <BranchWarehouseContext.Provider value={value}>{children}</BranchWarehouseContext.Provider>;
};

export const useBranchWarehouse = (): BranchWarehouseContextValue => {
  const context = useContext(BranchWarehouseContext);
  if (!context) {
    throw new Error('useBranchWarehouse must be used within a BranchWarehouseProvider');
  }
  return context;
};
