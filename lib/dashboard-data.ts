import { count, desc, eq } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"
import { user } from "@/db/schema"
import { getRedisJson, setRedisJson } from "@/lib/redis"

const DASHBOARD_OVERVIEW_CACHE_KEY = "dashboard:overview"
const DASHBOARD_OVERVIEW_CACHE_TTL_SECONDS = 60

type DashboardOverview = {
  totals: {
    users: number
    verifiedUsers: number
  }
  sessionStorage: "Redis" | "Database"
  recentUsers: Array<{
    id: string
    name: string
    email: string
    emailVerified: boolean
    createdAt: Date
  }>
}

type CachedDashboardOverview = {
  totals: DashboardOverview["totals"]
  sessionStorage: DashboardOverview["sessionStorage"]
  recentUsers: Array<{
    id: string
    name: string
    email: string
    emailVerified: boolean
    createdAt: string
  }>
}

function hydrateDashboardOverview(
  overview: CachedDashboardOverview,
): DashboardOverview {
  return {
    totals: overview.totals,
    sessionStorage: overview.sessionStorage,
    recentUsers: overview.recentUsers.map((recentUser) => ({
      ...recentUser,
      createdAt: new Date(recentUser.createdAt),
    })),
  }
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  "use cache"

  console.log("[dashboard-data] getDashboardOverview executed", {
    at: new Date().toISOString(),
    env: process.env.NODE_ENV,
  })

  cacheLife("minutes")
  cacheTag("dashboard-overview")

  const cachedOverview =
    await getRedisJson<CachedDashboardOverview>(DASHBOARD_OVERVIEW_CACHE_KEY)

  if (cachedOverview) {
    console.log("[dashboard-data] redis cache hit", {
      key: DASHBOARD_OVERVIEW_CACHE_KEY,
    })

    return hydrateDashboardOverview(cachedOverview)
  }

  const [
    totalUsersResult,
    verifiedUsersResult,
    recentUsers,
  ] = await Promise.all([
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(user).where(eq(user.emailVerified, true)),
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(5),
  ])

  const overview = {
    totals: {
      users: totalUsersResult[0]?.count ?? 0,
      verifiedUsers: verifiedUsersResult[0]?.count ?? 0,
    },
    sessionStorage: process.env.REDIS_URL ? ("Redis" as const) : ("Database" as const),
    recentUsers,
  }

  await setRedisJson(
    DASHBOARD_OVERVIEW_CACHE_KEY,
    {
      totals: overview.totals,
      sessionStorage: overview.sessionStorage,
      recentUsers: overview.recentUsers.map((recentUser) => ({
        ...recentUser,
        createdAt: recentUser.createdAt.toISOString(),
      })),
    } satisfies CachedDashboardOverview,
    DASHBOARD_OVERVIEW_CACHE_TTL_SECONDS,
  )

  return overview
}
