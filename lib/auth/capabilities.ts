import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { count, eq } from "drizzle-orm";

import { db } from "@/db";
import { member } from "@/db/schema";
import { auth } from "@/lib/auth";
import { type PlatformRoleKey, normalizePlatformRole } from "@/lib/auth/permissions";
import {
  appNavigation,
  type AppNavigationNode,
  buildNavigationPreview,
  flattenNavigationNodes,
  filterNavigationPreview,
  type NavigationPreviewNode,
} from "@/lib/navigation";

type AuthenticatedSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type OrganizationListItem = Awaited<
  ReturnType<typeof auth.api.listOrganizations>
>[number];

export type AppShellState = {
  session: AuthenticatedSession;
  activeOrganization: Awaited<ReturnType<typeof auth.api.getFullOrganization>> | null;
  organizations: OrganizationListItem[];
  hasOrganizationMembership: boolean;
  platformRole: PlatformRoleKey | null;
  navigation: NavigationPreviewNode[];
};

export async function getHasOrganizationMembership(userId: string) {
  const [membershipResult] = await db
    .select({
      count: count(),
    })
    .from(member)
    .where(eq(member.userId, userId))
    .limit(1);

  return (membershipResult?.count ?? 0) > 0;
}

export function shouldRedirectToOrganizationOnboarding(args: {
  hasOrganizationMembership: boolean;
  platformRole: PlatformRoleKey | null;
}) {
  return !args.hasOrganizationMembership && !args.platformRole;
}

export const getCachedRequestHeaders = cache(async () => headers());

const getCachedSession = cache(async () => {
  const requestHeaders = await getCachedRequestHeaders();

  return auth.api.getSession({
    headers: requestHeaders,
  });
});

const getCachedOrganizations = cache(async () => {
  const requestHeaders = await getCachedRequestHeaders();
  const session = await getCachedSession();

  if (!session) {
    return [] as OrganizationListItem[];
  }

  return auth.api.listOrganizations({
    headers: requestHeaders,
  });
});

const getCachedActiveOrganization = cache(async () => {
  const requestHeaders = await getCachedRequestHeaders();
  const session = await getCachedSession();

  if (!session?.session.activeOrganizationId) {
    return null;
  }

  return auth.api.getFullOrganization({
    headers: requestHeaders,
    query: {
      organizationId: session.session.activeOrganizationId,
    },
  });
});

export const getAppShellState = cache(async () => {
  const requestHeaders = await getCachedRequestHeaders();
  const session = await getCachedSession();

  if (!session) {
    return null;
  }

  const platformRole = normalizePlatformRole(session.user.role);
  const [hasOrganizationMembership, activeOrganization, organizations] =
    await Promise.all([
    getHasOrganizationMembership(session.user.id),
      getCachedActiveOrganization(),
      getCachedOrganizations(),
    ]);

  const allNavigationNodes = flattenNavigationNodes(appNavigation);
  const navigationNodeMap = new Map<string, AppNavigationNode>();

  for (const node of allNavigationNodes) {
    const key = JSON.stringify({
      scope: node.scope,
      permissions:
        node.scope === "platform"
          ? node.platformPermissions
          : node.organizationPermissions,
    });

    if (!navigationNodeMap.has(key)) {
      navigationNodeMap.set(key, node);
    }
  }

  const navigationNodes = Array.from(navigationNodeMap.values());

  const permissionResults = await Promise.all(
    navigationNodes.map(async (node: AppNavigationNode) => {
      if (node.scope === "organization" && node.organizationPermissions) {
        if (!activeOrganization) {
          return [node.id, false] as const;
        }

        const result = await auth.api.hasPermission({
          headers: requestHeaders,
          body: {
            organizationId: activeOrganization.id,
            permissions: node.organizationPermissions,
          },
        });

        return [node.id, Boolean(result.success)] as const;
      }

      if (node.scope === "platform" && node.platformPermissions) {
        const result = await auth.api.userHasPermission({
          headers: requestHeaders,
          body: {
            permissions: node.platformPermissions,
          },
        });

        return [node.id, Boolean(result.success)] as const;
      }

      return [node.id, true] as const;
    }),
  );

  const permissionMap = new Map(permissionResults);
  const preview = buildNavigationPreview(appNavigation, {
    hasActiveOrganization: Boolean(activeOrganization),
    hasOrganizationPermission: (permissions) => {
      const entry = allNavigationNodes.find(
          (node: AppNavigationNode) =>
            node.scope === "organization" &&
            JSON.stringify(node.organizationPermissions) ===
              JSON.stringify(permissions),
        );

      if (!entry) {
        return true;
      }

      return permissionMap.get(entry.id) ?? false;
    },
    hasPlatformPermission: (permissions) => {
      const entry = allNavigationNodes.find(
          (node: AppNavigationNode) =>
            node.scope === "platform" &&
            JSON.stringify(node.platformPermissions) ===
              JSON.stringify(permissions),
        );

      if (!entry) {
        return true;
      }

      return permissionMap.get(entry.id) ?? false;
    },
  });

  return {
    session,
    activeOrganization,
    organizations,
    hasOrganizationMembership,
    platformRole,
    navigation: filterNavigationPreview(preview),
  } satisfies AppShellState;
});
