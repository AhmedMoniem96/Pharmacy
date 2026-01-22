import * as React from "react"
import { AlertTriangle, PackageSearch } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { SectionCard } from "@/pages/dashboard/SectionCard"

export interface LowStockItem {
  id?: number
  name?: string
  stock?: number
  min?: number
  sku?: string
}

interface LowStockAlertsProps {
  alerts?: LowStockItem[]
  isLoading?: boolean
  headerSlot?: React.ReactNode
}

const getSeverity = (stock: number, min: number) => {
  if (min > 0 && stock <= min * 0.5) {
    return "Critical"
  }
  if (min <= 0 && stock <= 10) {
    return "Critical"
  }
  return "Low"
}

const severityVariant = (severity: string) => {
  if (severity === "Critical") return "danger" as const
  return "warning" as const
}

export const LowStockAlerts: React.FC<LowStockAlertsProps> = ({
  alerts = [],
  isLoading = false,
  headerSlot,
}) => {
  const skeletons = Array.from({ length: 3 })
  const viewAllHref = "/products"

  return (
    <SectionCard
      title="Low stock alerts"
      description="Items approaching reorder thresholds"
      icon={AlertTriangle}
      headerSlot={
        <div className="flex items-center gap-3">
          {headerSlot ?? (
            <Button variant="secondary" size="sm">
              Review inventory
            </Button>
          )}
          {viewAllHref ? (
            <Link
              className="text-xs font-medium text-muted-foreground transition hover:text-foreground hover:underline hover:decoration-muted-foreground/60 underline-offset-4"
              to={viewAllHref}
            >
              View all
            </Link>
          ) : (
            <span
              className="cursor-not-allowed text-xs font-medium text-muted-foreground/60"
              title="View all is unavailable"
            >
              View all
            </span>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {isLoading ? (
          skeletons.map((_, index) => (
            <div key={`low-stock-skeleton-${index}`} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-7 w-20" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))
        ) : alerts.length ? (
          alerts.map((item) => {
            const stock = item.stock ?? 0
            const min = item.min ?? 0
            const severity = getSeverity(stock, min)
            const progress = min > 0 ? Math.min((stock / min) * 100, 100) : 0
            const barClass =
              severity === "Critical" ? "bg-rose-500" : "bg-amber-500"

            return (
              <div
                key={item.id ?? item.sku ?? item.name}
                className="rounded-xl border border-border/60 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <PackageSearch className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {item.name ?? "Unnamed item"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.sku ? `${item.sku} • ` : ""}
                        {stock} units left
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={severityVariant(severity)}>{severity}</Badge>
                    <Button size="sm" variant="outline">
                      Restock
                    </Button>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{stock} remaining</span>
                    <span>Min: {min || "--"}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className={cn("h-2 rounded-full", barClass)}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/30 px-6 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <PackageSearch className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Stock levels look healthy
              </p>
              <p className="text-xs text-muted-foreground">
                You’ll see alerts here when items approach their reorder
                thresholds.
              </p>
            </div>
            <Button asChild size="sm" variant="secondary">
              <Link to={viewAllHref}>Review inventory</Link>
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  )
}
