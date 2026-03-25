"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import {
  cancelOrganizationInvitationAction,
  inviteOrganizationMemberAction,
  updateOrganizationMemberRoleAction,
} from "@/app/(app)/organizations/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import {
  type DynamicOrganizationRole,
  canActorAssignOrganizationRole,
} from "@/lib/auth/hierarchy";
import {
  getOrganizationRoleLabel,
  organizationRoleOptions,
  organizationRoles,
} from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import {
  Building2Icon,
  MailPlusIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

type PermissionRecord = Record<string, string[]>;

type PermissionFlags = {
  invite: boolean;
  cancelInvite: boolean;
  manageMembers: boolean;
  readRoles: boolean;
};

type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
};

type OrganizationMember = {
  id: string;
  role: string;
  userId: string;
  createdAt: string | Date;
  user: {
    name: string;
    email: string;
  };
};

type OrganizationInvitation = {
  id: string;
  email: string;
  role: string;
  status: string;
};

type ActiveOrganization = {
  id: string;
  name: string;
  slug: string;
  members: OrganizationMember[];
  invitations: OrganizationInvitation[];
};

type OrganizationSettingsPanelProps = {
  currentUserId: string;
  organizations: OrganizationSummary[];
  activeOrganization: ActiveOrganization | null;
  activeMemberRole: string;
  dynamicRoles: DynamicOrganizationRole[];
  permissionFlags: PermissionFlags;
  roleLoadError?: string | null;
};

const initialCreateValues = { name: "", slug: "", logo: "" };

function getAuthErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return fallback;
  const authError = error as { message?: string; error?: { message?: string } };
  return authError.message ?? authError.error?.message ?? fallback;
}

function slugifyOrganizationName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function OrganizationSettingsPanel({
  currentUserId,
  organizations: organizationData,
  activeOrganization,
  activeMemberRole,
  dynamicRoles,
  permissionFlags,
  roleLoadError,
}: OrganizationSettingsPanelProps) {
  const router = useRouter();
  const [createValues, setCreateValues] = useState(initialCreateValues);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [memberRoleDrafts, setMemberRoleDrafts] = useState<Record<string, string>>(
    {},
  );
  const [isSlugDirty, setIsSlugDirty] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [pendingOrganizationId, setPendingOrganizationId] = useState<
    string | null
  >(null);
  const [pendingInvitationId, setPendingInvitationId] = useState<string | null>(
    null,
  );
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const organizations = useMemo(
    () =>
      [...organizationData].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    [organizationData],
  );
  const pendingInvitations =
    activeOrganization?.invitations.filter(
      (invitation) => invitation.status === "pending",
    ) ?? [];

  const combinedRoleOptions = useMemo(() => {
    const builtInRoles = organizationRoleOptions.map((role) => ({
      role: role.role,
      label: role.label,
      description: role.description,
      builtIn: true,
      permission: organizationRoles[role.role].statements as PermissionRecord,
    }));
    const customRoles = dynamicRoles
      .filter(
        (dynamicRole) =>
          !organizationRoleOptions.some((role) => role.role === dynamicRole.role),
      )
      .map((dynamicRole) => ({
        role: dynamicRole.role,
        label: getOrganizationRoleLabel(dynamicRole.role),
        description: "Custom organization role",
        builtIn: false,
        permission: dynamicRole.permission,
      }));

    return [...builtInRoles, ...customRoles];
  }, [dynamicRoles]);

  useEffect(() => {
    if (!activeOrganization?.members.length) {
      setMemberRoleDrafts({});
      return;
    }

    setMemberRoleDrafts(
      Object.fromEntries(
        activeOrganization.members.map((member) => [member.id, member.role]),
      ),
    );
  }, [activeOrganization?.members]);

  const onRefresh = () =>
    startTransition(() => {
      router.refresh();
    });

  const handleCreateOrganization = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const name = createValues.name.trim();
    const slug = createValues.slug.trim();
    const logo = createValues.logo.trim();
    setCreateError(null);
    setNotice(null);

    if (!name || !slug) {
      setCreateError("Enter both a company name and an organization slug.");
      return;
    }

    setIsCreating(true);
    const result = await authClient.organization.create({
      name,
      slug,
      ...(logo ? { logo } : {}),
    });

    if (result.error) {
      setCreateError(
        getAuthErrorMessage(result.error, "Could not create organization."),
      );
      setIsCreating(false);
      return;
    }

    setCreateValues(initialCreateValues);
    setIsSlugDirty(false);
    setNotice(`${name} is ready. It's now your active organization.`);
    onRefresh();
    setIsCreating(false);
  };

  const handleSetActiveOrganization = async (organizationId: string) => {
    if (pendingOrganizationId === organizationId) return;
    setPendingOrganizationId(organizationId);
    setInviteError(null);
    setMemberError(null);
    setNotice(null);

    const result = await authClient.organization.setActive({
      organizationId,
    });

    if (result.error) {
      setInviteError(
        getAuthErrorMessage(result.error, "Could not switch organizations."),
      );
      setPendingOrganizationId(null);
      return;
    }

    onRefresh();
    setPendingOrganizationId(null);
  };

  const handleInviteMember = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!activeOrganization) {
      setInviteError("Choose an active organization before inviting teammates.");
      return;
    }

    const email = inviteEmail.trim().toLowerCase();
    setInviteError(null);
    setNotice(null);

    if (!email) {
      setInviteError("Enter an email address to send an invitation.");
      return;
    }

    setIsInviting(true);
    const result = await inviteOrganizationMemberAction({
      email,
      role: inviteRole,
    });

    if (!result.success) {
      setInviteError(result.error ?? "Could not send the invitation.");
      setIsInviting(false);
      return;
    }

    setInviteEmail("");
    setInviteRole("member");
    setNotice(result.notice ?? `Invitation sent to ${email}.`);
    onRefresh();
    setIsInviting(false);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (pendingInvitationId === invitationId) return;

    setPendingInvitationId(invitationId);
    setInviteError(null);
    setNotice(null);

    const result = await cancelOrganizationInvitationAction({
      invitationId,
    });

    if (!result.success) {
      setInviteError(result.error ?? "Could not cancel the invitation.");
      setPendingInvitationId(null);
      return;
    }

    setNotice(result.notice ?? "Invitation canceled.");
    onRefresh();
    setPendingInvitationId(null);
  };

  const handleMemberRoleUpdate = async (memberId: string) => {
    if (!activeOrganization || pendingMemberId === memberId) return;

    const role = memberRoleDrafts[memberId];

    if (!role) {
      setMemberError("Choose a role before saving the member update.");
      return;
    }

    setPendingMemberId(memberId);
    setMemberError(null);
    setNotice(null);

    const result = await updateOrganizationMemberRoleAction({
      memberId,
      role,
    });

    if (!result.success) {
      setMemberError(result.error ?? "Could not update the member role.");
      setPendingMemberId(null);
      return;
    }

    setNotice(result.notice ?? "Member role updated.");
    onRefresh();
    setPendingMemberId(null);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization directory</CardTitle>
            <CardDescription>
              Switch the active tenant or create a new workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {organizations.length ? (
              organizations.map((organization) => {
                const isActive = activeOrganization?.id === organization.id;
                const isSwitching = pendingOrganizationId === organization.id;

                return (
                  <div
                    key={organization.id}
                    className={cn(
                      "flex flex-col gap-4 rounded-xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between",
                      isActive && "border-primary/30 bg-primary/5",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {organization.name}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {organization.slug}
                      </p>
                    </div>
                    <Button
                      variant={isActive ? "secondary" : "outline"}
                      type="button"
                      disabled={isActive || isSwitching}
                      onClick={() => handleSetActiveOrganization(organization.id)}
                    >
                      {isSwitching
                        ? "Switching..."
                        : isActive
                          ? "Active"
                          : "Set active"}
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
                No organizations yet. Create your first company workspace below.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create an organization</CardTitle>
            <CardDescription>
              Each organization becomes its own tenant context.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleCreateOrganization}>
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Company name</span>
                <Input
                  placeholder="Acme Holdings"
                  value={createValues.name}
                  onChange={(event) => {
                    const nextName = event.target.value;
                    setCreateValues((currentValues) => ({
                      ...currentValues,
                      name: nextName,
                      slug: isSlugDirty
                        ? currentValues.slug
                        : slugifyOrganizationName(nextName),
                    }));
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Slug</span>
                <Input
                  placeholder="acme-holdings"
                  value={createValues.slug}
                  onChange={(event) => {
                    setIsSlugDirty(true);
                    setCreateValues((currentValues) => ({
                      ...currentValues,
                      slug: slugifyOrganizationName(event.target.value),
                    }));
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Logo URL</span>
                <Input
                  placeholder="https://example.com/logo.png"
                  value={createValues.logo}
                  onChange={(event) =>
                    setCreateValues((currentValues) => ({
                      ...currentValues,
                      logo: event.target.value,
                    }))
                  }
                />
              </label>
              {createError ? (
                <p className="text-sm text-destructive">{createError}</p>
              ) : null}
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create organization"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active organization</CardTitle>
            <CardDescription>
              The current tenant context drives the session scope.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeOrganization ? (
              <>
                <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/30 p-4">
                  <div className="rounded-xl border border-border/70 bg-background p-2">
                    <Building2Icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{activeOrganization.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {activeOrganization.slug}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Signed in as{" "}
                      <span className="font-medium text-foreground">
                        {getOrganizationRoleLabel(activeMemberRole)}
                      </span>
                      .
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UsersIcon className="size-4" />
                      Members
                    </div>
                    <p className="mt-2 text-2xl font-semibold">
                      {activeOrganization.members.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MailPlusIcon className="size-4" />
                      Pending invites
                    </div>
                    <p className="mt-2 text-2xl font-semibold">
                      {pendingInvitations.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShieldCheckIcon className="size-4" />
                      Your role
                    </div>
                    <p className="mt-2 text-2xl font-semibold">
                      {getOrganizationRoleLabel(activeMemberRole)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/organizations/access-control" />}
                  >
                    Open access control
                  </Button>
                  {permissionFlags.readRoles ? (
                    <p className="self-center text-sm text-muted-foreground">
                      Review custom roles and module visibility from the new
                      dedicated access-control page.
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
                No active organization yet. Pick one from the directory or create
                one first.
              </div>
            )}
            {notice ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
                {notice}
              </div>
            ) : null}
            {roleLoadError ? (
              <p className="text-sm text-destructive">{roleLoadError}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite members</CardTitle>
            <CardDescription>
              Send invitation links with the exact role the teammate should
              receive.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {permissionFlags.invite ? (
              <form className="space-y-4" onSubmit={handleInviteMember}>
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">Email</span>
                  <Input
                    type="email"
                    placeholder="ops@acme.com"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {combinedRoleOptions.map((role) => {
                    const isAllowed = canActorAssignOrganizationRole({
                      actorRole: activeMemberRole,
                      nextTargetRole: role.role,
                      dynamicRoles,
                    });

                    return (
                      <Button
                        key={role.role}
                        type="button"
                        variant={inviteRole === role.role ? "secondary" : "outline"}
                        disabled={!isAllowed}
                        onClick={() => setInviteRole(role.role)}
                      >
                        {role.label}
                      </Button>
                    );
                  })}
                </div>
                {inviteError ? (
                  <p className="text-sm text-destructive">{inviteError}</p>
                ) : null}
                <Button type="submit" disabled={isInviting || !activeOrganization}>
                  {isInviting ? "Sending invitation..." : "Send invitation"}
                </Button>
              </form>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
                Your current role does not include the invitation create
                permission.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              Current people in the active organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeOrganization?.members.length ? (
              activeOrganization.members.map((member) => {
                const nextRole = memberRoleDrafts[member.id] ?? member.role;
                const isSaving = pendingMemberId === member.id;
                const isAllowed = canActorAssignOrganizationRole({
                  actorRole: activeMemberRole,
                  currentTargetRole: member.role,
                  nextTargetRole: nextRole,
                  dynamicRoles,
                });
                const canSave =
                  permissionFlags.manageMembers &&
                  nextRole !== member.role &&
                  isAllowed &&
                  member.userId !== currentUserId;

                return (
                  <div
                    key={member.id}
                    className="flex flex-col gap-4 rounded-xl border border-border/70 bg-muted/30 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {member.user.name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full border border-border/70 px-2 py-1">
                          Joined {formatDate(member.createdAt)}
                        </span>
                        <span className="rounded-full border border-border/70 px-2 py-1">
                          Current: {getOrganizationRoleLabel(member.role)}
                        </span>
                      </div>
                    </div>
                    {permissionFlags.manageMembers ? (
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <select
                          value={nextRole}
                          onChange={(event) =>
                            setMemberRoleDrafts((currentDrafts) => ({
                              ...currentDrafts,
                              [member.id]: event.target.value,
                            }))
                          }
                          className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {combinedRoleOptions.map((role) => {
                            const optionAllowed = canActorAssignOrganizationRole({
                              actorRole: activeMemberRole,
                              currentTargetRole: member.role,
                              nextTargetRole: role.role,
                              dynamicRoles,
                            });

                            return (
                              <option
                                key={role.role}
                                value={role.role}
                                disabled={!optionAllowed}
                              >
                                {role.label}
                              </option>
                            );
                          })}
                        </select>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!canSave || isSaving}
                          onClick={() => handleMemberRoleUpdate(member.id)}
                        >
                          {isSaving ? "Saving..." : "Save role"}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
                No members yet beyond the current org superadmin.
              </div>
            )}
            {memberError ? (
              <p className="text-sm text-destructive">{memberError}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
            <CardDescription>
              Outstanding invites waiting for a teammate to accept.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvitations.length ? (
              pendingInvitations.map((invitation) => {
                const isCanceling = pendingInvitationId === invitation.id;

                return (
                  <div
                    key={invitation.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {invitation.email}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        Role:{" "}
                        <span>{getOrganizationRoleLabel(invitation.role)}</span>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={!permissionFlags.cancelInvite || isCanceling}
                      onClick={() => handleCancelInvitation(invitation.id)}
                    >
                      {isCanceling ? "Canceling..." : "Cancel"}
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
                No pending invitations for the active organization.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
