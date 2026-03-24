"use server";

import { updateTag } from "next/cache";

export async function refreshDashboardOverview() {
  updateTag("dashboard-overview");
}
