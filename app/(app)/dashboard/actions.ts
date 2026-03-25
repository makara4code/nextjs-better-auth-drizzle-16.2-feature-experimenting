"use server";

import { updateTag } from "next/cache";

import { deleteRedisKey } from "@/lib/redis";

export async function refreshDashboardOverview() {
  updateTag("dashboard-overview");
  await deleteRedisKey("dashboard:overview");
}
