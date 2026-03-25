import { CheckCircle2Icon, ShieldCheckIcon, UsersIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDashboardOverview } from "@/lib/dashboard-data"

export async function OverviewStats({
  organizationId,
  organizationName,
}: {
  organizationId?: string | null
  organizationName?: string | null
}) {
  const overview = await getDashboardOverview(organizationId)
  const statStyles = organizationId
    ? [
        {
          label: "Members",
          description: `People currently assigned to ${organizationName ?? "the active organization"}.`,
          icon: UsersIcon,
          value: overview.totals.users,
        },
        {
          label: "Pending invites",
          description: "Invitation links still waiting to be accepted.",
          icon: ShieldCheckIcon,
          value: overview.totals.pendingInvitations,
        },
        {
          label: "Verified members",
          description: "Members whose accounts have completed email verification.",
          icon: CheckCircle2Icon,
          value: overview.totals.verifiedUsers,
        },
      ]
    : [
        {
          label: "Total users",
          description: "Accounts stored in Postgres through Drizzle.",
          icon: UsersIcon,
          value: overview.totals.users,
        },
        {
          label: "Session storage",
          description: "Better Auth session records now resolve from the active auth storage backend.",
          icon: ShieldCheckIcon,
          value: overview.sessionStorage,
        },
        {
          label: "Verified emails",
          description: "Users who have completed email verification.",
          icon: CheckCircle2Icon,
          value: overview.totals.verifiedUsers,
        },
      ]

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
                  {item.value}
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
