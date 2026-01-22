import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCcw } from 'lucide-react';
import { useBranchWarehouse } from '@/context/BranchWarehouseContext';

type DashboardHeaderProps = {
  lastUpdatedAt?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ lastUpdatedAt, onRefresh, isRefreshing }) => {
  const { t } = useTranslation();
  const {
    branches,
    warehouses,
    shortcuts,
    selectedBranch,
    selectedWarehouse,
    setSelectedBranch,
    setSelectedWarehouse,
  } = useBranchWarehouse();
  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return 'Last updated: --';
    }

    const formattedTime = new Date(lastUpdatedAt).toLocaleString();
    return `Last updated: ${formattedTime}`;
  }, [lastUpdatedAt]);
  const fallbackShortcut = useMemo(() => {
    if (!selectedBranch || !selectedWarehouse) {
      return [];
    }

    const branch = branches.find((item) => String(item.id) === selectedBranch);
    const warehouse = warehouses.find((item) => String(item.id) === selectedWarehouse);

    if (!branch || !warehouse) {
      return [];
    }

    return [
      {
        branchId: selectedBranch,
        warehouseId: selectedWarehouse,
        branchName: branch.name,
        warehouseName: warehouse.name,
      },
    ];
  }, [branches, selectedBranch, selectedWarehouse, warehouses]);
  const pillCombos = shortcuts.length ? shortcuts : fallbackShortcut;

  return (
    <div className="sticky top-0 z-20 -mx-6 border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {t('welcome')}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t('dashboard')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track performance, inventory health, and urgent alerts in one place.
          </p>
          {pillCombos.length > 0 ? (
            <div
              className="mt-3 flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Common branch and warehouse filters"
              dir="ltr"
            >
              {pillCombos.map((combo) => {
                const isActive =
                  combo.branchId === selectedBranch && combo.warehouseId === selectedWarehouse;
                return (
                  <button
                    key={`${combo.branchId}-${combo.warehouseId}`}
                    type="button"
                    onClick={() => {
                      setSelectedBranch(combo.branchId);
                      setSelectedWarehouse(combo.warehouseId);
                    }}
                    aria-pressed={isActive}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      isActive
                        ? 'border-primary/40 bg-primary/10 text-foreground'
                        : 'border-border/60 bg-background text-foreground hover:border-border hover:bg-muted/60'
                    }`}
                  >
                    <span>{combo.branchName}</span>
                    <span className="text-muted-foreground">/</span>
                    <span>{combo.warehouseName}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3 lg:justify-end">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-medium">{lastUpdatedLabel}</span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Refresh dashboard data"
            >
              <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:w-auto">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Period</label>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Quarter to date</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Region</label>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm">
                <option>All locations</option>
                <option>Downtown</option>
                <option>Suburban</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority</label>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm">
                <option>All alerts</option>
                <option>Critical only</option>
                <option>Expiring soon</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
