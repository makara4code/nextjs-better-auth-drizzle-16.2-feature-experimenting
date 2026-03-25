import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type {
  OrganizationPermissionMap,
  PlatformPermissionMap,
} from "./permissions";
import { auth } from "../auth";

export class AuthorizationError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 = 403,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function getRequestHeaders() {
  return headers();
}

export async function getRequiredSession() {
  const requestHeaders = await getRequestHeaders();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    redirect("/sign-in");
  }

  return {
    requestHeaders,
    session,
  };
}

export async function getRequiredActiveOrganization() {
  const { requestHeaders, session } = await getRequiredSession();
  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    redirect("/organizations");
  }

  const organization = await auth.api.getFullOrganization({
    headers: requestHeaders,
    query: {
      organizationId,
    },
  });

  if (!organization) {
    redirect("/organizations");
  }

  return {
    requestHeaders,
    session,
    organization,
  };
}

export async function hasOrgPermission(
  permissions: OrganizationPermissionMap,
  organizationId?: string,
) {
  const { requestHeaders, session } = await getRequiredSession();

  const result = await auth.api.hasPermission({
    headers: requestHeaders,
    body: {
      organizationId:
        organizationId ?? session.session.activeOrganizationId ?? undefined,
      permissions,
    },
  });

  return Boolean(result.success);
}

export async function requireOrgPermission(
  permissions: OrganizationPermissionMap,
  organizationId?: string,
) {
  const context = await getRequiredActiveOrganization();
  const allowed = await auth.api.hasPermission({
    headers: context.requestHeaders,
    body: {
      organizationId: organizationId ?? context.organization.id ?? undefined,
      permissions,
    },
  });

  if (!allowed.success) {
    throw new AuthorizationError(
      "You do not have permission to perform this action in the active organization.",
    );
  }

  return context;
}

export async function hasPlatformPermission(permissions: PlatformPermissionMap) {
  const { requestHeaders } = await getRequiredSession();

  const result = await auth.api.userHasPermission({
    headers: requestHeaders,
    body: {
      permissions,
    },
  });

  return Boolean(result.success);
}

export async function requirePlatformPermission(
  permissions: PlatformPermissionMap,
) {
  const context = await getRequiredSession();
  const allowed = await auth.api.userHasPermission({
    headers: context.requestHeaders,
    body: {
      permissions,
    },
  });

  if (!allowed.success) {
    throw new AuthorizationError(
      "You do not have access to the platform administration surface.",
    );
  }

  return context;
}
