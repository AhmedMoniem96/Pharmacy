import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCcw } from 'lucide-react';

type DashboardHeaderProps = {
  lastUpdatedAt?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ lastUpdatedAt, onRefresh, isRefreshing }) => {
  const { t } = useTranslation();
  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return 'Last updated: --';
    }

    const formattedTime = new Date(lastUpdatedAt).toLocaleString();
    return `Last updated: ${formattedTime}`;
  }, [lastUpdatedAt]);

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
