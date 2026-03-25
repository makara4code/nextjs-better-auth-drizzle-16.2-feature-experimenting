import { ShieldCheckIcon } from "lucide-react";

import { AccessControlPanel } from "@/components/organizations/access-control-panel";
import { auth } from "@/lib/auth";
import { requireOrgPermission } from "@/lib/auth/guards";
import { sanitizeOrganizationPermissionMap } from "@/lib/auth/hierarchy";

async function getRoleData(args: {
  requestHeaders: Headers;
  organizationId: string;
}) {
  const [dynamicRoles, canCreateRoles, canUpdateRoles, canDeleteRoles] =
    await Promise.all([
      auth.api.listOrgRoles({
        headers: args.requestHeaders,
        query: {
          organizationId: args.organizationId,
        },
      }),
      auth.api.hasPermission({
        headers: args.requestHeaders,
        body: {
          organizationId: args.organizationId,
          permissions: {
            ac: ["create"],
          },
        },
      }),
      auth.api.hasPermission({
        headers: args.requestHeaders,
        body: {
          organizationId: args.organizationId,
          permissions: {
            ac: ["update"],
          },
        },
      }),
      auth.api.hasPermission({
        headers: args.requestHeaders,
        body: {
          organizationId: args.organizationId,
          permissions: {
            ac: ["delete"],
          },
        },
      }),
    ]);

  return {
    dynamicRoles: dynamicRoles.map((role) => ({
      ...role,
      permission: sanitizeOrganizationPermissionMap(
        role.permission as Record<string, string[]>,
      ),
    })),
    canCreateRoles: Boolean(canCreateRoles.success),
    canUpdateRoles: Boolean(canUpdateRoles.success),
    canDeleteRoles: Boolean(canDeleteRoles.success),
  };
}

export default async function OrganizationAccessControlPage() {
  const context = await requireOrgPermission({
    ac: ["read"],
  });
  const actorRole =
    context.organization.members.find(
      (member) => member.userId === context.session.user.id,
    )?.role ?? "member";
  const roleData = await getRoleData({
    requestHeaders: context.requestHeaders,
    organizationId: context.organization.id,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Organization Access Control
          </h1>
          <p className="text-sm text-muted-foreground">
            Review how each org role maps to sidebar visibility and module permissions
            for <span className="font-medium text-foreground">{context.organization.name}</span>.
          </p>
        </div>
        <div className="rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <ShieldCheckIcon className="size-3.5" />
            Active organization:{" "}
            <span className="font-medium text-foreground">
              {context.organization.slug}
            </span>
          </span>
        </div>
      </div>

      <AccessControlPanel
        organization={{
          id: context.organization.id,
          name: context.organization.name,
          slug: context.organization.slug,
        }}
        actorRole={actorRole}
        dynamicRoles={roleData.dynamicRoles}
        canCreateRoles={roleData.canCreateRoles}
        canUpdateRoles={roleData.canUpdateRoles}
        canDeleteRoles={roleData.canDeleteRoles}
      />
    </div>
  );
}
