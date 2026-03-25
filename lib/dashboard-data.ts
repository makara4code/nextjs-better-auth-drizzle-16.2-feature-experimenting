import { and, count, desc, eq } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"
import { invitation, member, user } from "@/db/schema"
import { getRedisJson, setRedisJson } from "@/lib/redis"

const DASHBOARD_OVERVIEW_CACHE_PREFIX = "dashboard:overview"
const DASHBOARD_OVERVIEW_CACHE_TTL_SECONDS = 60

export function getDashboardOverviewCacheKey(organizationId?: string | null) {
  return `${DASHBOARD_OVERVIEW_CACHE_PREFIX}:${organizationId ?? "global"}`
}

type DashboardOverview = {
  totals: {
    users: number
    verifiedUsers: number
    pendingInvitations: number
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

export async function getDashboardOverview(
  organizationId?: string | null,
): Promise<DashboardOverview> {
  "use cache"

  const cacheKey = getDashboardOverviewCacheKey(organizationId)

  console.log("[dashboard-data] getDashboardOverview executed", {
    at: new Date().toISOString(),
    env: process.env.NODE_ENV,
    organizationId: organizationId ?? "global",
  })

  cacheLife("minutes")
  cacheTag("dashboard-overview")

  const cachedOverview =
    await getRedisJson<CachedDashboardOverview>(cacheKey)

  if (cachedOverview) {
    console.log("[dashboard-data] redis cache hit", {
      key: cacheKey,
    })

    return hydrateDashboardOverview(cachedOverview)
  }

  const overview = organizationId
    ? await getOrganizationDashboardOverview(organizationId)
    : await getGlobalDashboardOverview()

  await setRedisJson(
    cacheKey,
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

async function getGlobalDashboardOverview(): Promise<DashboardOverview> {
  const [totalUsersResult, verifiedUsersResult, recentUsers] = await Promise.all([
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

  return {
    totals: {
      users: totalUsersResult[0]?.count ?? 0,
      verifiedUsers: verifiedUsersResult[0]?.count ?? 0,
      pendingInvitations: 0,
    },
    sessionStorage: process.env.REDIS_URL ? ("Redis" as const) : ("Database" as const),
    recentUsers,
  }
}

async function getOrganizationDashboardOverview(
  organizationId: string,
): Promise<DashboardOverview> {
  const [
    totalMembersResult,
    verifiedMembersResult,
    pendingInvitationsResult,
    recentUsers,
  ] = await Promise.all([
    db.select({ count: count() }).from(member).where(eq(member.organizationId, organizationId)),
    db
      .select({ count: count() })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(
        and(
          eq(member.organizationId, organizationId),
          eq(user.emailVerified, true),
        ),
      ),
    db
      .select({ count: count() })
      .from(invitation)
      .where(
        and(
          eq(invitation.organizationId, organizationId),
          eq(invitation.status, "pending"),
        ),
      ),
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: member.createdAt,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, organizationId))
      .orderBy(desc(member.createdAt))
      .limit(5),
  ])

  return {
    totals: {
      users: totalMembersResult[0]?.count ?? 0,
      verifiedUsers: verifiedMembersResult[0]?.count ?? 0,
      pendingInvitations: pendingInvitationsResult[0]?.count ?? 0,
    },
    sessionStorage: process.env.REDIS_URL ? ("Redis" as const) : ("Database" as const),
    recentUsers,
  }
}
