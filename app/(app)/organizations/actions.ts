"use server";

import { revalidatePath, updateTag } from "next/cache";

import { auth } from "@/lib/auth";
import {
  type DynamicOrganizationRole,
  canActorAssignOrganizationRole,
  canActorManageDynamicRoleDefinition,
  resolveOrganizationRolePermissionMap,
  sanitizeOrganizationPermissionMap,
} from "@/lib/auth/hierarchy";
import { AuthorizationError, requireOrgPermission } from "@/lib/auth/guards";
import { isBuiltInOrganizationRole } from "@/lib/auth/permissions";
import { getOrganizationWorkspaceCacheTag } from "@/lib/organization-workspace-data";

type OrganizationActionResult = {
  success: boolean;
  error?: string;
  notice?: string;
};

function getAuthErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const authError = error as {
    message?: string;
    error?: {
      message?: string;
    };
  };

  return authError.message ?? authError.error?.message ?? fallback;
}

async function getDynamicOrganizationRoles(
  requestHeaders: Headers,
  organizationId: string,
): Promise<DynamicOrganizationRole[]> {
  const roles = await auth.api.listOrgRoles({
    headers: requestHeaders,
    query: {
      organizationId,
    },
  });

  return roles.map((role) => ({
    ...role,
    permission: sanitizeOrganizationPermissionMap(
      role.permission as Record<string, string[]>,
    ),
  }));
}

function getActorRole(args: {
  organization: NonNullable<Awaited<ReturnType<typeof auth.api.getFullOrganization>>>;
  userId: string;
}) {
  return (
    args.organization.members.find((member) => member.userId === args.userId)?.role ??
    null
  );
}

function revalidateOrganizationSurfaces(organizationId?: string) {
  revalidatePath("/organizations");
  revalidatePath("/organizations/workspace");
  revalidatePath("/organizations/access-control");

  if (organizationId) {
    updateTag(getOrganizationWorkspaceCacheTag(organizationId));
  }
}

export async function inviteOrganizationMemberAction(args: {
  email: string;
  role: string;
}): Promise<OrganizationActionResult> {
  try {
    const context = await requireOrgPermission({
      invitation: ["create"],
    });
    const actorRole = getActorRole({
      organization: context.organization,
      userId: context.session.user.id,
    });

    if (!actorRole) {
      throw new AuthorizationError("Could not resolve your active organization role.");
    }

    const dynamicRoles = await getDynamicOrganizationRoles(
      context.requestHeaders,
      context.organization.id,
    );

    if (
      !resolveOrganizationRolePermissionMap(args.role, dynamicRoles) ||
      !canActorAssignOrganizationRole({
        actorRole,
        nextTargetRole: args.role,
        dynamicRoles,
      })
    ) {
      throw new AuthorizationError(
        "Your organization role cannot assign the requested invitation role.",
      );
    }

    await auth.api.createInvitation({
      headers: context.requestHeaders,
      body: {
        organizationId: context.organization.id,
        email: args.email.trim().toLowerCase(),
        role: args.role as never,
      },
    });

    revalidateOrganizationSurfaces(context.organization.id);

    return {
      success: true,
      notice: `Invitation sent to ${args.email.trim().toLowerCase()}.`,
    };
  } catch (error) {
    return {
      success: false,
      error: getAuthErrorMessage(error, "Could not send the invitation."),
    };
  }
}

export async function cancelOrganizationInvitationAction(args: {
  invitationId: string;
}): Promise<OrganizationActionResult> {
  try {
    const context = await requireOrgPermission({
      invitation: ["cancel"],
    });
    await auth.api.cancelInvitation({
      headers: context.requestHeaders,
      body: {
        invitationId: args.invitationId,
      },
    });

    revalidateOrganizationSurfaces(context.organization.id);

    return {
      success: true,
      notice: "Invitation canceled.",
    };
  } catch (error) {
    return {
      success: false,
      error: getAuthErrorMessage(error, "Could not cancel the invitation."),
    };
  }
}

export async function updateOrganizationMemberRoleAction(args: {
  memberId: string;
  role: string;
}): Promise<OrganizationActionResult> {
  try {
    const context = await requireOrgPermission({
      member: ["update"],
    });
    const actorRole = getActorRole({
      organization: context.organization,
      userId: context.session.user.id,
    });
    const currentMember = context.organization.members.find(
      (member) => member.id === args.memberId,
    );

    if (!actorRole || !currentMember) {
      throw new AuthorizationError("Could not resolve the requested organization member.");
    }

    const dynamicRoles = await getDynamicOrganizationRoles(
      context.requestHeaders,
      context.organization.id,
    );

    if (
      !resolveOrganizationRolePermissionMap(args.role, dynamicRoles) ||
      !canActorAssignOrganizationRole({
        actorRole,
        currentTargetRole: currentMember.role,
        nextTargetRole: args.role,
        dynamicRoles,
      })
    ) {
      throw new AuthorizationError(
        "Your organization role cannot apply the requested member role.",
      );
    }

    await auth.api.updateMemberRole({
      headers: context.requestHeaders,
      body: {
        memberId: args.memberId,
        organizationId: context.organization.id,
        role: args.role as never,
      },
    });

    revalidateOrganizationSurfaces(context.organization.id);

    return {
      success: true,
      notice: "Member role updated.",
    };
  } catch (error) {
    return {
      success: false,
      error: getAuthErrorMessage(error, "Could not update the member role."),
    };
  }
}

export async function createOrganizationRoleAction(args: {
  role: string;
  permission: Record<string, string[]>;
}): Promise<OrganizationActionResult> {
  try {
    const context = await requireOrgPermission({
      ac: ["create"],
    });
    const actorRole = getActorRole({
      organization: context.organization,
      userId: context.session.user.id,
    });
    const roleName = args.role.trim();
    const nextPermission = sanitizeOrganizationPermissionMap(args.permission);

    if (!actorRole) {
      throw new AuthorizationError("Could not resolve your active organization role.");
    }

    if (!roleName) {
      return {
        success: false,
        error: "Enter a role name before saving.",
      };
    }

    if (!Object.keys(nextPermission).length) {
      return {
        success: false,
        error: "Pick at least one permission for the custom role.",
      };
    }

    if (isBuiltInOrganizationRole(roleName)) {
      return {
        success: false,
        error: "Built-in roles cannot be recreated as custom roles.",
      };
    }

    const dynamicRoles = await getDynamicOrganizationRoles(
      context.requestHeaders,
      context.organization.id,
    );

    if (
      !canActorManageDynamicRoleDefinition({
        actorRole,
        nextPermission,
        dynamicRoles,
      })
    ) {
      throw new AuthorizationError(
        "Your organization role cannot create a custom role with these permissions.",
      );
    }

    await auth.api.createOrgRole({
      headers: context.requestHeaders,
      body: {
        organizationId: context.organization.id,
        role: roleName,
        permission: nextPermission,
      },
    });

    revalidateOrganizationSurfaces(context.organization.id);

    return {
      success: true,
      notice: `Role ${roleName} created.`,
    };
  } catch (error) {
    return {
      success: false,
      error: getAuthErrorMessage(error, "Could not create the custom role."),
    };
  }
}

export async function updateOrganizationRoleAction(args: {
  roleName: string;
  permission: Record<string, string[]>;
}): Promise<OrganizationActionResult> {
  try {
    const context = await requireOrgPermission({
      ac: ["update"],
    });
    const actorRole = getActorRole({
      organization: context.organization,
      userId: context.session.user.id,
    });
    const nextPermission = sanitizeOrganizationPermissionMap(args.permission);

    if (!actorRole) {
      throw new AuthorizationError("Could not resolve your active organization role.");
    }

    if (isBuiltInOrganizationRole(args.roleName)) {
      return {
        success: false,
        error: "Built-in roles are fixed and cannot be edited at runtime.",
      };
    }

    const dynamicRoles = await getDynamicOrganizationRoles(
      context.requestHeaders,
      context.organization.id,
    );
    const currentRole = dynamicRoles.find((role) => role.role === args.roleName);

    if (!currentRole) {
      return {
        success: false,
        error: "The selected custom role no longer exists.",
      };
    }

    if (
      !canActorManageDynamicRoleDefinition({
        actorRole,
        nextPermission,
        dynamicRoles,
      })
    ) {
      throw new AuthorizationError(
        "Your organization role cannot apply these custom role permissions.",
      );
    }

    await auth.api.updateOrgRole({
      headers: context.requestHeaders,
      body: {
        organizationId: context.organization.id,
        roleName: currentRole.role,
        data: {
          permission: nextPermission,
        },
      },
    });

    revalidateOrganizationSurfaces(context.organization.id);

    return {
      success: true,
      notice: `Role ${currentRole.role} updated.`,
    };
  } catch (error) {
    return {
      success: false,
      error: getAuthErrorMessage(error, "Could not update the custom role."),
    };
  }
}

export async function deleteOrganizationRoleAction(args: {
  roleName: string;
}): Promise<OrganizationActionResult> {
  try {
    const context = await requireOrgPermission({
      ac: ["delete"],
    });
    const actorRole = getActorRole({
      organization: context.organization,
      userId: context.session.user.id,
    });

    if (!actorRole) {
      throw new AuthorizationError("Could not resolve your active organization role.");
    }

    if (isBuiltInOrganizationRole(args.roleName)) {
      return {
        success: false,
        error: "Built-in roles cannot be deleted.",
      };
    }

    const dynamicRoles = await getDynamicOrganizationRoles(
      context.requestHeaders,
      context.organization.id,
    );
    const currentRole = dynamicRoles.find((role) => role.role === args.roleName);

    if (!currentRole) {
      return {
        success: false,
        error: "The selected custom role no longer exists.",
      };
    }

    if (
      !canActorManageDynamicRoleDefinition({
        actorRole,
        nextPermission: currentRole.permission,
        dynamicRoles,
      })
    ) {
      throw new AuthorizationError(
        "Your organization role cannot delete this custom role.",
      );
    }

    await auth.api.deleteOrgRole({
      headers: context.requestHeaders,
      body: {
        organizationId: context.organization.id,
        roleName: currentRole.role,
      },
    });

    revalidateOrganizationSurfaces(context.organization.id);

    return {
      success: true,
      notice: `Role ${currentRole.role} deleted.`,
    };
  } catch (error) {
    return {
      success: false,
      error: getAuthErrorMessage(error, "Could not delete the custom role."),
    };
  }
}
