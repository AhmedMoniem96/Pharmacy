import * as React from "react"
import { Receipt } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { SectionCard } from "@/pages/dashboard/SectionCard"

const sales = [
  {
    id: "RS-2039",
    customer: "Brightwell Clinic",
    total: "$4,320",
    time: "Today, 11:45 AM",
    status: "Paid",
    channel: "Card",
  },
  {
    id: "RS-2038",
    customer: "NovaCare Pharmacy",
    total: "$2,910",
    time: "Today, 09:18 AM",
    status: "Pending",
    channel: "Invoice",
  },
  {
    id: "RS-2037",
    customer: "Lakeview Hospital",
    total: "$6,180",
    time: "Yesterday, 4:20 PM",
    status: "Paid",
    channel: "Wire",
  },
]

const statusVariant = (status: string) => {
  if (status === "Paid") return "success" as const
  if (status === "Pending") return "warning" as const
  return "secondary" as const
}

const getInitials = (name: string) => {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
  return initials || "NA"
}

export const RecentSalesList: React.FC = () => {
  const viewAllHref = "/reports"

  return (
    <SectionCard
      title="Recent sales"
      description="Latest invoices and order totals"
      icon={Receipt}
      headerSlot={
        viewAllHref ? (
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
        )
      }
    >
      <div className="space-y-2">
        {sales.map((sale) => (
          <div
            key={sale.id}
            className="group rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-border/60 hover:bg-muted/50"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {getInitials(sale.customer)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {sale.customer}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {sale.id} • {sale.time}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:text-right">
                <Badge variant={statusVariant(sale.status)}>{sale.status}</Badge>
                <div className="min-w-[90px] text-right font-mono text-sm font-semibold text-foreground">
                  {sale.total}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Channel</span>
              <Badge variant="secondary">{sale.channel}</Badge>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
