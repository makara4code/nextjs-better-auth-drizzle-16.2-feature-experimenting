"use server";

import { updateTag } from "next/cache";

import { getDashboardOverviewCacheKey } from "@/lib/dashboard-data";
import { deleteRedisKey } from "@/lib/redis";

export async function refreshDashboardOverview(organizationId?: string | null) {
  updateTag("dashboard-overview");
  await deleteRedisKey(getDashboardOverviewCacheKey(organizationId));
}
