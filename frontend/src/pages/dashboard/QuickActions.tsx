import * as React from "react"
import {
  FilePlus,
  PackagePlus,
  RefreshCcw,
  Truck,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SectionCard } from "@/pages/dashboard/SectionCard"

const actions: Array<{ label: string; description: string; icon: LucideIcon }> = [
  {
    label: "Create purchase order",
    description: "Draft a new supplier order",
    icon: FilePlus,
  },
  {
    label: "Receive shipment",
    description: "Log incoming inventory",
    icon: Truck,
  },
  {
    label: "Add new product",
    description: "Register a new SKU",
    icon: PackagePlus,
  },
  {
    label: "Sync stock counts",
    description: "Refresh on-hand totals",
    icon: RefreshCcw,
  },
]

export const QuickActions: React.FC = () => {
  return (
    <SectionCard
      title="Quick actions"
      description="Jump into everyday workflows"
      icon={PackagePlus}
      contentClassName="pt-2"
    >
      <div className="grid gap-3">
        {actions.map((action, index) => {
          const ActionIcon = action.icon
          return (
            <div key={action.label} className="space-y-3">
              <Button
                variant="outline"
                className="h-auto w-full justify-start gap-3 rounded-2xl border-border/60 px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <ActionIcon className="h-4 w-4" />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {action.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </span>
              </Button>
              {index < actions.length - 1 ? <Separator /> : null}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}
