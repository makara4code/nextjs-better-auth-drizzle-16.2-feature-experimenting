import {
  type OrganizationPermissionMap,
  type OrganizationRoleKey,
  canOrganizationActorManageBuiltInRole,
  getBuiltInOrganizationPermissionMap,
  isBuiltInOrganizationRole,
  isPermissionMapSubset,
  organizationStatements,
} from "@/lib/auth/permissions";

export type DynamicOrganizationRole = {
  id: string;
  organizationId: string;
  role: string;
  permission: OrganizationPermissionMap;
  createdAt: Date;
  updatedAt?: Date;
};

export function sanitizeOrganizationPermissionMap(
  permission: Record<string, string[]>,
): OrganizationPermissionMap {
  const nextPermission: Record<string, string[]> = {};

  for (const [resource, actions] of Object.entries(permission)) {
    if (!(resource in organizationStatements)) {
      continue;
    }

    const supportedActions = organizationStatements[
      resource as keyof typeof organizationStatements
    ] as readonly string[];
    const safeActions = Array.from(
      new Set(actions.filter((action) => supportedActions.includes(action))),
    );

    if (!safeActions.length) {
      continue;
    }

    nextPermission[resource] = safeActions;
  }

  return nextPermission as OrganizationPermissionMap;
}

export function resolveOrganizationRolePermissionMap(
  role: string,
  dynamicRoles: DynamicOrganizationRole[],
): OrganizationPermissionMap | null {
  if (isBuiltInOrganizationRole(role)) {
    return getBuiltInOrganizationPermissionMap(role);
  }

  const dynamicRole = dynamicRoles.find((candidate) => candidate.role === role);

  return dynamicRole?.permission ?? null;
}

export function getOrganizationRoleDefinitions(
  dynamicRoles: DynamicOrganizationRole[],
) {
  return [
    ...(["org_superadmin", "org_admin", "manager", "member", "viewer"] as const).map(
      (role) => ({
        role,
        permission: getBuiltInOrganizationPermissionMap(role),
        builtIn: true,
      }),
    ),
    ...dynamicRoles.map((role) => ({
      role: role.role,
      permission: role.permission,
      builtIn: false,
    })),
  ];
}

export function canActorAssignOrganizationRole(args: {
  actorRole: string;
  currentTargetRole?: string | null;
  nextTargetRole: string;
  dynamicRoles: DynamicOrganizationRole[];
}) {
  const { actorRole, currentTargetRole, nextTargetRole, dynamicRoles } = args;

  const actorPermission = resolveOrganizationRolePermissionMap(
    actorRole,
    dynamicRoles,
  );
  const nextPermission = resolveOrganizationRolePermissionMap(
    nextTargetRole,
    dynamicRoles,
  );
  const currentPermission = currentTargetRole
    ? resolveOrganizationRolePermissionMap(currentTargetRole, dynamicRoles)
    : null;

  if (!actorPermission || !nextPermission) {
    return false;
  }

  if (isBuiltInOrganizationRole(actorRole)) {
    if (actorRole === "org_superadmin") {
      return true;
    }

    if (actorRole === "org_admin") {
      const currentBuiltInRole = currentTargetRole
        ? (isBuiltInOrganizationRole(currentTargetRole)
            ? currentTargetRole
            : null)
        : null;
      const nextBuiltInRole = isBuiltInOrganizationRole(nextTargetRole)
        ? nextTargetRole
        : null;

      if (
        (currentBuiltInRole &&
          !canOrganizationActorManageBuiltInRole(actorRole, currentBuiltInRole)) ||
        (nextBuiltInRole &&
          !canOrganizationActorManageBuiltInRole(actorRole, nextBuiltInRole))
      ) {
        return false;
      }

      const adminPermission = getBuiltInOrganizationPermissionMap("org_admin");

      return (
        isPermissionMapSubset(nextPermission, adminPermission) &&
        (!currentPermission ||
          isPermissionMapSubset(currentPermission, adminPermission))
      );
    }

    return false;
  }

  const protectedBuiltInRoles: OrganizationRoleKey[] = [
    "org_superadmin",
    "org_admin",
  ];
  const currentBuiltInRole =
    currentTargetRole && isBuiltInOrganizationRole(currentTargetRole)
      ? currentTargetRole
      : null;
  const nextBuiltInRole = isBuiltInOrganizationRole(nextTargetRole)
    ? nextTargetRole
    : null;

  if (
    (currentBuiltInRole && protectedBuiltInRoles.includes(currentBuiltInRole)) ||
    (nextBuiltInRole && protectedBuiltInRoles.includes(nextBuiltInRole))
  ) {
    return false;
  }

  return (
    isPermissionMapSubset(nextPermission, actorPermission) &&
    (!currentPermission || isPermissionMapSubset(currentPermission, actorPermission))
  );
}

export function canActorManageDynamicRoleDefinition(args: {
  actorRole: string;
  nextPermission: OrganizationPermissionMap;
  dynamicRoles: DynamicOrganizationRole[];
}) {
  const { actorRole, nextPermission, dynamicRoles } = args;

  if (isBuiltInOrganizationRole(actorRole) && actorRole === "org_superadmin") {
    return true;
  }

  const actorPermission = resolveOrganizationRolePermissionMap(
    actorRole,
    dynamicRoles,
  );

  if (!actorPermission) {
    return false;
  }

  return isPermissionMapSubset(nextPermission, actorPermission);
}
