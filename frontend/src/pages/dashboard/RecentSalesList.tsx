import * as React from "react"
import { CreditCard, Receipt, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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

export const RecentSalesList: React.FC = () => {
  return (
    <SectionCard
      title="Recent sales"
      description="Latest invoices and order totals"
      icon={Receipt}
      headerSlot={
        <Button variant="outline" size="sm">
          View all
        </Button>
      }
    >
      <div className="space-y-4">
        {sales.map((sale, index) => (
          <div key={sale.id} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Users className="h-4 w-4" />
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
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant(sale.status)}>{sale.status}</Badge>
                <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  {sale.total}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Channel</span>
              <Badge variant="secondary">{sale.channel}</Badge>
            </div>
            {index < sales.length - 1 ? <Separator /> : null}
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
