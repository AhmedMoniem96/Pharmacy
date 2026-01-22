import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface SectionCardProps {
  title: string
  description?: string
  icon?: LucideIcon
  headerSlot?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  icon: Icon,
  headerSlot,
  children,
  className,
  contentClassName,
}) => {
  return (
    <Card
      className={cn(
        "rounded-2xl border-border/60 bg-card/80 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              {title}
            </CardTitle>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {headerSlot ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {headerSlot}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className={cn("space-y-4 pt-2", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
