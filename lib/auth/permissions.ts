import { createAccessControl } from "better-auth/plugins/access";

export const organizationStatements = {
  organization: ["update", "delete"],
  member: ["create", "read", "update", "delete"],
  invitation: ["create", "read", "cancel"],
  ac: ["create", "read", "update", "delete"],
  settings: ["read", "update"],
  project: ["create", "read", "update", "delete"],
} as const;

export const organizationAc = createAccessControl(organizationStatements);

export const organizationRoles = {
  org_superadmin: organizationAc.newRole({
    organization: ["update", "delete"],
    member: ["create", "read", "update", "delete"],
    invitation: ["create", "read", "cancel"],
    ac: ["create", "read", "update", "delete"],
    settings: ["read", "update"],
    project: ["create", "read", "update", "delete"],
  }),
  org_admin: organizationAc.newRole({
    organization: ["update"],
    member: ["create", "read", "update", "delete"],
    invitation: ["create", "read", "cancel"],
    ac: ["create", "read", "update"],
    settings: ["read", "update"],
    project: ["create", "read", "update", "delete"],
  }),
  manager: organizationAc.newRole({
    member: ["read"],
    invitation: ["read"],
    settings: ["read"],
    project: ["create", "read", "update"],
  }),
  member: organizationAc.newRole({
    member: ["read"],
    invitation: ["read"],
    settings: ["read"],
    project: ["create", "read", "update"],
  }),
  viewer: organizationAc.newRole({
    member: ["read"],
    invitation: ["read"],
    settings: ["read"],
    project: ["read"],
  }),
} as const;

export const defaultOrganizationRole = "member" as const;

export const organizationRoleHierarchy = [
  "viewer",
  "member",
  "manager",
  "org_admin",
  "org_superadmin",
] as const;

export const organizationRoleRank = Object.freeze({
  viewer: 0,
  member: 1,
  manager: 2,
  org_admin: 3,
  org_superadmin: 4,
} satisfies Record<OrganizationRoleKey, number>);

export const organizationRoleOptions = [
  {
    role: "org_superadmin",
    label: "Org Superadmin",
    description:
      "Full tenant control, including destructive organization and RBAC actions.",
    builtIn: true,
  },
  {
    role: "org_admin",
    label: "Org Admin",
    description:
      "Manage members, invitations, settings, custom roles, and projects.",
    builtIn: true,
  },
  {
    role: "manager",
    label: "Manager",
    description:
      "Run day-to-day project work without tenant administration powers.",
    builtIn: true,
  },
  {
    role: "member",
    label: "Member",
    description: "Create and update projects inside the current organization.",
    builtIn: true,
  },
  {
    role: "viewer",
    label: "Viewer",
    description: "Read-only access across the active organization workspace.",
    builtIn: true,
  },
] as const;

export const organizationPermissionCatalog = [
  {
    resource: "project",
    label: "Projects",
    actions: [
      {
        action: "create",
        label: "Create projects",
      },
      {
        action: "read",
        label: "View projects",
      },
      {
        action: "update",
        label: "Edit projects",
      },
      {
        action: "delete",
        label: "Delete projects",
      },
    ],
  },
  {
    resource: "member",
    label: "Members",
    actions: [
      {
        action: "read",
        label: "View members",
      },
      {
        action: "create",
        label: "Add members",
      },
      {
        action: "update",
        label: "Change member roles",
      },
      {
        action: "delete",
        label: "Remove members",
      },
    ],
  },
  {
    resource: "invitation",
    label: "Invitations",
    actions: [
      {
        action: "read",
        label: "View invitations",
      },
      {
        action: "create",
        label: "Invite members",
      },
      {
        action: "cancel",
        label: "Cancel invitations",
      },
    ],
  },
  {
    resource: "settings",
    label: "Settings",
    actions: [
      {
        action: "read",
        label: "View settings",
      },
      {
        action: "update",
        label: "Update settings",
      },
    ],
  },
  {
    resource: "ac",
    label: "Access Control",
    actions: [
      {
        action: "read",
        label: "View roles",
      },
      {
        action: "create",
        label: "Create roles",
      },
      {
        action: "update",
        label: "Edit roles",
      },
      {
        action: "delete",
        label: "Delete roles",
      },
    ],
  },
  {
    resource: "organization",
    label: "Organization",
    actions: [
      {
        action: "update",
        label: "Update organization",
      },
      {
        action: "delete",
        label: "Delete organization",
      },
    ],
  },
] as const;

export const platformStatements = {
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "impersonate-admins",
    "delete",
    "set-password",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
} as const;

export const platformAc = createAccessControl(platformStatements);

export const platformRoles = {
  user: platformAc.newRole({
    user: [],
    session: [],
  }),
  global_admin: platformAc.newRole({
    user: ["list", "ban", "get", "update"],
    session: ["list", "revoke"],
  }),
  global_superadmin: platformAc.newRole({
    user: [
      "create",
      "list",
      "set-role",
      "ban",
      "impersonate",
      "impersonate-admins",
      "delete",
      "set-password",
      "get",
      "update",
    ],
    session: ["list", "revoke", "delete"],
  }),
} as const;

export const internalPlatformDefaultRole = "user" as const;

export const platformRoleHierarchy = [
  "global_admin",
  "global_superadmin",
] as const;

export const platformRoleRank = Object.freeze({
  global_admin: 0,
  global_superadmin: 1,
} satisfies Record<PlatformRoleKey, number>);

export const platformRoleOptions = [
  {
    role: "global_admin",
    label: "Global Admin",
    description:
      "Internal operator with platform-wide user moderation and session controls.",
  },
  {
    role: "global_superadmin",
    label: "Global Superadmin",
    description:
      "Highest-trust operator who can assign platform roles and perform break-glass actions.",
  },
] as const;

export const platformPermissionCatalog = [
  {
    resource: "user",
    label: "Users",
    actions: [
      {
        action: "list",
        label: "List users",
      },
      {
        action: "get",
        label: "Inspect users",
      },
      {
        action: "set-role",
        label: "Set platform roles",
      },
      {
        action: "ban",
        label: "Ban and unban users",
      },
      {
        action: "impersonate",
        label: "Impersonate users",
      },
      {
        action: "impersonate-admins",
        label: "Impersonate platform operators",
      },
    ],
  },
  {
    resource: "session",
    label: "Sessions",
    actions: [
      {
        action: "list",
        label: "List sessions",
      },
      {
        action: "revoke",
        label: "Revoke sessions",
      },
      {
        action: "delete",
        label: "Delete session records",
      },
    ],
  },
] as const;

export type OrganizationRoleKey = keyof typeof organizationRoles;
export type PlatformInternalRoleKey = keyof typeof platformRoles;
export type PlatformRoleKey = Exclude<PlatformInternalRoleKey, "user">;
export type OrganizationPermissionMap = Partial<{
  [K in keyof typeof organizationStatements]: Array<
    (typeof organizationStatements)[K][number]
  >;
}>;
export type PlatformPermissionMap = Partial<{
  [K in keyof typeof platformStatements]: Array<
    (typeof platformStatements)[K][number]
  >;
}>;

function prettifyRoleLabel(value: string) {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isBuiltInOrganizationRole(
  role: string | null | undefined,
): role is OrganizationRoleKey {
  return Boolean(role && role in organizationRoles);
}

export function isPlatformRole(
  role: string | null | undefined,
): role is PlatformRoleKey {
  return role === "global_admin" || role === "global_superadmin";
}

export function normalizePlatformRole(
  role: string | null | undefined,
): PlatformRoleKey | null {
  return isPlatformRole(role) ? role : null;
}

export function getOrganizationRoleOption(role: string) {
  return organizationRoleOptions.find((option) => option.role === role) ?? null;
}

export function getOrganizationRoleLabel(role: string | null | undefined) {
  if (!role) {
    return "Unknown role";
  }

  return getOrganizationRoleOption(role)?.label ?? prettifyRoleLabel(role);
}

export function getPlatformRoleOption(role: string) {
  return platformRoleOptions.find((option) => option.role === role) ?? null;
}

export function getPlatformRoleLabel(role: string | null | undefined) {
  if (!role) {
    return "No platform role";
  }

  return getPlatformRoleOption(role)?.label ?? prettifyRoleLabel(role);
}

export function getBuiltInOrganizationPermissionMap(
  role: OrganizationRoleKey,
): OrganizationPermissionMap {
  return organizationRoles[role].statements as OrganizationPermissionMap;
}

export function getBuiltInPlatformPermissionMap(
  role: PlatformInternalRoleKey,
): PlatformPermissionMap {
  return platformRoles[role].statements as PlatformPermissionMap;
}

export function compareOrganizationRoles(
  leftRole: OrganizationRoleKey,
  rightRole: OrganizationRoleKey,
) {
  return organizationRoleRank[leftRole] - organizationRoleRank[rightRole];
}

export function comparePlatformRoles(
  leftRole: PlatformRoleKey,
  rightRole: PlatformRoleKey,
) {
  return platformRoleRank[leftRole] - platformRoleRank[rightRole];
}

export function isPermissionMapSubset<
  TMap extends Record<string, string[] | undefined>,
>(candidate: TMap, allowed: TMap) {
  for (const [resource, actions] of Object.entries(candidate)) {
    const candidateActions = actions ?? [];
    const allowedActions = allowed[resource] ?? [];

    if (!candidateActions.every((action) => allowedActions.includes(action))) {
      return false;
    }
  }

  return true;
}

export function canOrganizationActorManageBuiltInRole(
  actorRole: OrganizationRoleKey,
  targetRole: OrganizationRoleKey,
) {
  if (actorRole === "org_superadmin") {
    return true;
  }

  if (actorRole === "org_admin") {
    return targetRole !== "org_superadmin";
  }

  return false;
}

export function canPlatformActorManageRole(
  actorRole: PlatformRoleKey | null,
  targetRole: PlatformRoleKey | null,
) {
  if (actorRole !== "global_superadmin") {
    return false;
  }

  return targetRole !== "global_superadmin" || actorRole === targetRole;
}
