import * as React from "react"
import {
  FilePlus,
  PackagePlus,
  RefreshCcw,
  Truck,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionCard } from "@/pages/dashboard/SectionCard"

const actions: Array<{
  label: string
  icon: LucideIcon
  shortcut?: string
}> = [
  {
    label: "Create purchase order",
    icon: FilePlus,
    shortcut: "⌘N",
  },
  {
    label: "Receive shipment",
    icon: Truck,
    shortcut: "Alt+R",
  },
  {
    label: "Add new product",
    icon: PackagePlus,
    shortcut: "⌘P",
  },
  {
    label: "Sync stock counts",
    icon: RefreshCcw,
    shortcut: "⌘R",
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
        {actions.map((action) => {
          const ActionIcon = action.icon
          return (
            <Card
              key={action.label}
              className="border-border/60 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md active:translate-y-0 active:shadow-sm"
            >
              <CardContent className="p-2">
                <Button
                  variant="ghost"
                  className="h-auto w-full justify-start gap-3 rounded-2xl px-4 py-3 text-left hover:bg-muted/60 active:bg-muted/80"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <ActionIcon className="h-4 w-4" />
                  </span>
                  <span className="flex flex-1 items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {action.label}
                    </span>
                    <span className="rounded-md border border-border/60 bg-muted/70 px-2 py-0.5 text-xs font-mono text-muted-foreground">
                      {action.shortcut}
                    </span>
                  </span>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </SectionCard>
  )
}
