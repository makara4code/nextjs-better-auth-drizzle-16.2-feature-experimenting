import { CheckCircle2Icon, ShieldCheckIcon, UsersIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDashboardOverview } from "@/lib/dashboard-data"

const statStyles = [
  {
    label: "Total users",
    description: "Accounts stored in Postgres through Drizzle.",
    icon: UsersIcon,
    valueKey: "users" as const,
  },
  {
    label: "Active sessions",
    description: "Current Better Auth sessions in the session table.",
    icon: ShieldCheckIcon,
    valueKey: "sessions" as const,
  },
  {
    label: "Verified emails",
    description: "Users who have completed email verification.",
    icon: CheckCircle2Icon,
    valueKey: "verifiedUsers" as const,
  },
]

export async function OverviewStats() {
  const overview = await getDashboardOverview()

  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-2 xl:grid-cols-3">
      {statStyles.map((item) => {
        const Icon = item.icon

        return (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="mt-2 text-3xl">
                  {overview.totals[item.valueKey]}
                </CardTitle>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/50 p-2">
                <Icon className="size-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
