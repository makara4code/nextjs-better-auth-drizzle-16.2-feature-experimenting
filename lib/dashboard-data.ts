import { count, desc, eq } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"
import { session, user } from "@/db/schema"

export async function getDashboardOverview() {
  "use cache"

  console.log("[dashboard-data] getDashboardOverview executed", {
    at: new Date().toISOString(),
    env: process.env.NODE_ENV,
  })

  cacheLife("minutes")
  cacheTag("dashboard-overview")

  const [
    totalUsersResult,
    totalSessionsResult,
    verifiedUsersResult,
    recentUsers,
  ] = await Promise.all([
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(session),
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
      sessions: totalSessionsResult[0]?.count ?? 0,
      verifiedUsers: verifiedUsersResult[0]?.count ?? 0,
    },
    recentUsers,
  }
}
