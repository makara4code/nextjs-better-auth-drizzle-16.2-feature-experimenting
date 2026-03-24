import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDashboardOverview } from "@/lib/dashboard-data"

export async function RecentUsers() {
  const overview = await getDashboardOverview()

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Recent users</CardTitle>
        <CardDescription>
          This panel and the stat cards above both call the same cached server
          helper, so the dashboard avoids duplicate DB work for identical data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {overview.recentUsers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
            No users yet. Create an account from the login page to see records
            here.
          </div>
        ) : (
          <div className="space-y-3">
            {overview.recentUsers.map((recentUser) => (
              <div
                key={recentUser.id}
                className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {recentUser.name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {recentUser.email}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border/70 px-2 py-1">
                    {recentUser.emailVerified ? "Verified" : "Pending"}
                  </span>
                  <span>
                    {recentUser.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
