import { redirect } from "next/navigation";

import { OrganizationSettingsPanel } from "@/components/organizations/organization-settings-panel";
import { getAppShellState } from "@/lib/auth/capabilities";
import {
  getOrganizationWorkspacePermissionFlags,
  getOrganizationWorkspaceSnapshot,
} from "@/lib/organization-workspace-data";

export default async function OrganizationWorkspacePage() {
  const shellState = await getAppShellState();

  if (!shellState) {
    redirect("/sign-in");
  }

  const activeMemberRole =
    shellState.activeOrganization?.members.find(
      (member) => member.userId === shellState.session.user.id,
    )?.role ?? null;
  const workspaceSnapshot = shellState.activeOrganization
    ? await getOrganizationWorkspaceSnapshot(shellState.activeOrganization.id)
    : null;
  const permissionFlags = getOrganizationWorkspacePermissionFlags({
    actorRole: activeMemberRole,
    dynamicRoles: workspaceSnapshot?.dynamicRoles ?? [],
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Organization Workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage company workspaces, switch the active tenant, and control
          members and invitations. Access control now lives on the dedicated
          org RBAC page.
        </p>
      </div>
      <OrganizationSettingsPanel
        currentUserId={shellState.session.user.id}
        organizations={shellState.organizations.map((organization) => ({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        }))}
        activeOrganization={
          workspaceSnapshot
            ? {
                id: workspaceSnapshot.organization.id,
                name: workspaceSnapshot.organization.name,
                slug: workspaceSnapshot.organization.slug,
                members: workspaceSnapshot.members.map((member) => ({
                  id: member.id,
                  role: member.role,
                  userId: member.userId,
                  createdAt: member.createdAt,
                  user: {
                    name: member.user.name,
                    email: member.user.email,
                  },
                })),
                invitations: workspaceSnapshot.invitations,
              }
            : null
        }
        activeMemberRole={activeMemberRole ?? "member"}
        dynamicRoles={workspaceSnapshot?.dynamicRoles ?? []}
        permissionFlags={permissionFlags}
        roleLoadError={null}
      />
    </div>
  );
}
