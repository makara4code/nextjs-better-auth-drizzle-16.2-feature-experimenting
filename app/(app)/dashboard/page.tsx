import { redirect } from "next/navigation"
import Link from "next/link"

import { RefreshDashboardButton } from "@/components/dashboard/refresh-dashboard-button"
import { OverviewStats } from "@/components/dashboard/overview-stats"
import { RecentUsers } from "@/components/dashboard/recent-users"
import { Button } from "@/components/ui/button"
import {
  getAppShellState,
  shouldRedirectToOrganizationOnboarding,
} from "@/lib/auth/capabilities"

export default async function Page() {
  const shellState = await getAppShellState()

  if (!shellState) {
    redirect("/sign-in")
  }

  if (
    !shellState.activeOrganization &&
    shouldRedirectToOrganizationOnboarding({
      hasOrganizationMembership: shellState.hasOrganizationMembership,
      platformRole: shellState.platformRole,
    })
  ) {
    redirect("/organizations")
  }

  const activeOrganization = shellState.activeOrganization

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {activeOrganization
              ? `Viewing ${activeOrganization.name}. Dashboard metrics now follow the active organization in your Better Auth session.`
              : shellState.platformRole
                ? "No organization is active, so this dashboard is showing platform-level summary data for the current operator."
                : "Pick or create an organization to turn this into a true tenant-scoped workspace."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!activeOrganization ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/organizations" />}
            >
              Open organizations
            </Button>
          ) : null}
          <RefreshDashboardButton organizationId={activeOrganization?.id ?? null} />
        </div>
      </div>
      <OverviewStats
        organizationId={activeOrganization?.id ?? null}
        organizationName={activeOrganization?.name ?? null}
      />
      <RecentUsers
        organizationId={activeOrganization?.id ?? null}
        organizationName={activeOrganization?.name ?? null}
      />
    </div>
  )
}
