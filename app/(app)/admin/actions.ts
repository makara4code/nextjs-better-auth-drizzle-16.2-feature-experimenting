"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import {
  getRequiredSession,
  AuthorizationError,
  requirePlatformPermission,
} from "@/lib/auth/guards";
import {
  canPlatformActorManageRole,
  getPlatformRoleLabel,
  normalizePlatformRole,
} from "@/lib/auth/permissions";

async function getTargetUser(userId: string) {
  const [targetUser] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

  return targetUser ?? null;
}

export async function updatePlatformUserRoleAction(formData: FormData) {
  const context = await requirePlatformPermission({
    user: ["set-role"],
  });

  const userId = String(formData.get("userId") ?? "").trim();
  const rawRole = String(formData.get("role") ?? "").trim();
  const role = normalizePlatformRole(rawRole || null);

  if (!userId) {
    throw new Error("A valid user id is required.");
  }

  const actorRole = normalizePlatformRole(context.session.user.role);
  const targetUser = await getTargetUser(userId);
  const targetRole = normalizePlatformRole(targetUser?.role);

  if (!targetUser || !canPlatformActorManageRole(actorRole, targetRole)) {
    throw new AuthorizationError(
      `Your platform role cannot manage ${getPlatformRoleLabel(targetRole)}.`,
    );
  }

  await db.update(user).set({ role }).where(eq(user.id, userId));

  revalidatePath("/admin");
}

export async function banPlatformUserAction(formData: FormData) {
  const context = await requirePlatformPermission({
    user: ["ban"],
  });

  const userId = String(formData.get("userId") ?? "").trim();
  const banReason = String(formData.get("banReason") ?? "").trim();
  const banExpiresInRaw = String(formData.get("banExpiresIn") ?? "").trim();
  const banExpiresIn = banExpiresInRaw ? Number(banExpiresInRaw) : undefined;

  if (!userId) {
    throw new Error("A user id is required.");
  }

  const actorRole = normalizePlatformRole(context.session.user.role);
  const targetUser = await getTargetUser(userId);
  const targetRole = normalizePlatformRole(targetUser?.role);

  if (targetRole && !canPlatformActorManageRole(actorRole, targetRole)) {
    throw new AuthorizationError(
      `Your platform role cannot moderate ${getPlatformRoleLabel(targetRole)}.`,
    );
  }

  await auth.api.banUser({
    headers: context.requestHeaders,
    body: {
      userId,
      ...(banReason ? { banReason } : {}),
      ...(Number.isFinite(banExpiresIn) ? { banExpiresIn } : {}),
    },
  });

  revalidatePath("/admin");
}

export async function unbanPlatformUserAction(formData: FormData) {
  const context = await requirePlatformPermission({
    user: ["ban"],
  });

  const userId = String(formData.get("userId") ?? "").trim();

  if (!userId) {
    throw new Error("A user id is required.");
  }

  const actorRole = normalizePlatformRole(context.session.user.role);
  const targetUser = await getTargetUser(userId);
  const targetRole = normalizePlatformRole(targetUser?.role);

  if (targetRole && !canPlatformActorManageRole(actorRole, targetRole)) {
    throw new AuthorizationError(
      `Your platform role cannot moderate ${getPlatformRoleLabel(targetRole)}.`,
    );
  }

  await auth.api.unbanUser({
    headers: context.requestHeaders,
    body: {
      userId,
    },
  });

  revalidatePath("/admin");
}

export async function revokePlatformUserSessionsAction(formData: FormData) {
  const context = await requirePlatformPermission({
    session: ["revoke"],
  });

  const userId = String(formData.get("userId") ?? "").trim();

  if (!userId) {
    throw new Error("A user id is required.");
  }

  const actorRole = normalizePlatformRole(context.session.user.role);
  const targetUser = await getTargetUser(userId);
  const targetRole = normalizePlatformRole(targetUser?.role);

  if (targetRole && !canPlatformActorManageRole(actorRole, targetRole)) {
    throw new AuthorizationError(
      `Your platform role cannot revoke sessions for ${getPlatformRoleLabel(targetRole)}.`,
    );
  }

  await auth.api.revokeUserSessions({
    headers: context.requestHeaders,
    body: {
      userId,
    },
  });

  revalidatePath("/admin");
}

export async function stopImpersonatingAction() {
  const { requestHeaders } = await getRequiredSession();

  await auth.api.stopImpersonating({
    headers: requestHeaders,
  });

  revalidatePath("/admin");
}
