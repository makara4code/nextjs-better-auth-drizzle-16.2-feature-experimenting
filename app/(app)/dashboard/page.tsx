import { RefreshDashboardButton } from "@/components/dashboard/refresh-dashboard-button"
import { OverviewStats } from "@/components/dashboard/overview-stats"
import { RecentUsers } from "@/components/dashboard/recent-users"

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manually invalidate the cached overview to verify fresh data and
            cache behavior.
          </p>
        </div>
        <RefreshDashboardButton />
      </div>
      <OverviewStats />
      <RecentUsers />
    </div>
  )
}
