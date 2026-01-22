import * as React from "react"
import { AlertTriangle, PackageSearch, ShoppingCart } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SectionCard } from "@/pages/dashboard/SectionCard"

const alerts = [
  {
    name: "Amoxicillin 500mg",
    sku: "RX-AML-500",
    remaining: 18,
    level: "critical",
  },
  {
    name: "Insulin Glargine",
    sku: "RX-ING-210",
    remaining: 42,
    level: "warning",
  },
  {
    name: "Atorvastatin 20mg",
    sku: "RX-ATO-020",
    remaining: 63,
    level: "attention",
  },
]

const levelVariant = (level: string) => {
  if (level === "critical") return "danger" as const
  if (level === "warning") return "warning" as const
  return "secondary" as const
}

export const LowStockAlerts: React.FC = () => {
  return (
    <SectionCard
      title="Low stock alerts"
      description="Items nearing reorder thresholds"
      icon={AlertTriangle}
      headerSlot={
        <Button variant="secondary" size="sm">
          Review inventory
        </Button>
      }
    >
      <div className="space-y-4">
        {alerts.map((item, index) => (
          <div key={item.sku} className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <PackageSearch className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {item.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.sku} • {item.remaining} units left
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={levelVariant(item.level)}>{item.level}</Badge>
                <Button size="sm" variant="outline" className="gap-1">
                  <ShoppingCart className="h-4 w-4" />
                  Reorder
                </Button>
              </div>
            </div>
            {index < alerts.length - 1 ? <Separator /> : null}
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
