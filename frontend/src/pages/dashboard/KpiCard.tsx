import * as React from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SectionCard } from "@/pages/dashboard/SectionCard"

export interface KpiCardProps {
  title: string
  value: string
  change: string
  trend?: "up" | "down" | "neutral"
  icon: LucideIcon
  helperText?: string
}

const trendStyles = {
  up: {
    icon: ArrowUpRight,
    variant: "success" as const,
    label: "Improved",
  },
  down: {
    icon: ArrowDownRight,
    variant: "danger" as const,
    label: "Declined",
  },
  neutral: {
    icon: Minus,
    variant: "secondary" as const,
    label: "Stable",
  },
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  trend = "neutral",
  icon,
  helperText = "Compared to last period",
}) => {
  const trendMeta = trendStyles[trend]
  const TrendIcon = trendMeta.icon

  return (
    <SectionCard
      title={title}
      icon={icon}
      headerSlot={
        <Badge variant={trendMeta.variant} className="gap-1">
          <TrendIcon className="h-3.5 w-3.5" />
          {change}
        </Badge>
      }
      contentClassName="pt-0"
    >
      <div className="space-y-3">
        <div className="text-3xl font-semibold text-foreground sm:text-4xl">
          {value}
        </div>
        <Separator />
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {trendMeta.label}
          </span>{" "}
          {helperText}
        </div>
      </div>
    </SectionCard>
  )
}
