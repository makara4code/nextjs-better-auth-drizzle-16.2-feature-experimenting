import "server-only";

import { desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import {
  invitation,
  member,
  organization,
  organizationRole,
  user,
} from "@/db/schema";
import type { DynamicOrganizationRole } from "@/lib/auth/hierarchy";
import {
  getBuiltInOrganizationPermissionMap,
  isBuiltInOrganizationRole,
  type OrganizationPermissionMap,
} from "@/lib/auth/permissions";

export type OrganizationWorkspaceSnapshot = {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  members: Array<{
    id: string;
    role: string;
    userId: string;
    createdAt: Date;
    user: {
      name: string;
      email: string;
    };
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: string;
    status: string;
  }>;
  dynamicRoles: DynamicOrganizationRole[];
};

export function getOrganizationWorkspaceCacheTag(organizationId: string) {
  return `organization:${organizationId}:workspace`;
}

function parsePermissionMap(value: string): OrganizationPermissionMap {
  try {
    const parsed = JSON.parse(value) as Record<string, string[]>;

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

export async function getOrganizationWorkspaceSnapshot(organizationId: string) {
  "use cache";

  cacheLife("seconds");
  cacheTag(getOrganizationWorkspaceCacheTag(organizationId));

  const [organizationRows, memberRows, invitationRows, roleRows] =
    await Promise.all([
      db
        .select({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        })
        .from(organization)
        .where(eq(organization.id, organizationId))
        .limit(1),
      db
        .select({
          id: member.id,
          role: member.role,
          userId: member.userId,
          createdAt: member.createdAt,
          userName: user.name,
          userEmail: user.email,
        })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(eq(member.organizationId, organizationId))
        .orderBy(desc(member.createdAt)),
      db
        .select({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          createdAt: invitation.createdAt,
        })
        .from(invitation)
        .where(eq(invitation.organizationId, organizationId))
        .orderBy(desc(invitation.createdAt)),
      db
        .select({
          id: organizationRole.id,
          organizationId: organizationRole.organizationId,
          role: organizationRole.role,
          permission: organizationRole.permission,
          createdAt: organizationRole.createdAt,
          updatedAt: organizationRole.updatedAt,
        })
        .from(organizationRole)
        .where(eq(organizationRole.organizationId, organizationId))
        .orderBy(organizationRole.role),
    ]);

  const currentOrganization = organizationRows[0] ?? null;

  if (!currentOrganization) {
    return null;
  }

  return {
    organization: currentOrganization,
    members: memberRows.map((row) => ({
      id: row.id,
      role: row.role,
      userId: row.userId,
      createdAt: row.createdAt,
      user: {
        name: row.userName,
        email: row.userEmail,
      },
    })),
    invitations: invitationRows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
    })),
    dynamicRoles: roleRows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      role: row.role,
      permission: parsePermissionMap(row.permission),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? undefined,
    })),
  } satisfies OrganizationWorkspaceSnapshot;
}

export function getOrganizationWorkspacePermissionFlags(args: {
  actorRole: string | null;
  dynamicRoles: DynamicOrganizationRole[];
}) {
  const permissionMap =
    args.actorRole && isBuiltInOrganizationRole(args.actorRole)
      ? getBuiltInOrganizationPermissionMap(args.actorRole)
      : args.dynamicRoles.find((role) => role.role === args.actorRole)?.permission ??
        null;

  return {
    invite: permissionMap?.invitation?.includes("create") ?? false,
    cancelInvite: permissionMap?.invitation?.includes("cancel") ?? false,
    manageMembers: permissionMap?.member?.includes("update") ?? false,
    readRoles: permissionMap?.ac?.includes("read") ?? false,
  };
}
