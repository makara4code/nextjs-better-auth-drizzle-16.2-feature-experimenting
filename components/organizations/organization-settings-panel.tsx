"use client";

import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  Building2Icon,
  MailPlusIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

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

function slugifyOrganizationName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const initialCreateValues = {
  name: "",
  slug: "",
  logo: "",
};

const initialInviteValues = {
  email: "",
  role: "member" as "member" | "admin" | "owner",
};

export function OrganizationSettingsPanel() {
  const router = useRouter();
  const organizationsQuery = authClient.useListOrganizations();
  const activeOrganizationQuery = authClient.useActiveOrganization();
  const activeMemberRoleQuery = authClient.useActiveMemberRole();
  const [createValues, setCreateValues] = useState(initialCreateValues);
  const [inviteValues, setInviteValues] = useState(initialInviteValues);
  const [isSlugDirty, setIsSlugDirty] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [pendingOrganizationId, setPendingOrganizationId] = useState<
    string | null
  >(null);
  const [pendingInvitationId, setPendingInvitationId] = useState<string | null>(
    null,
  );
  const [createError, setCreateError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const organizations = useMemo(
    () =>
      [...(organizationsQuery.data ?? [])].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    [organizationsQuery.data],
  );
  const activeOrganization = activeOrganizationQuery.data;
  const activeMemberRole = activeMemberRoleQuery.data?.role ?? "member";
  const canManageInvitations =
    activeMemberRole === "owner" || activeMemberRole === "admin";
  const pendingInvitations =
    activeOrganization?.invitations.filter(
      (invitation) => invitation.status === "pending",
    ) ?? [];

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
    startTransition(() => {
      router.refresh();
    });
    setIsCreating(false);
  };

  const handleSetActiveOrganization = async (organizationId: string) => {
    if (pendingOrganizationId === organizationId) {
      return;
    }

    setNotice(null);
    setInviteError(null);
    setPendingOrganizationId(organizationId);

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

    startTransition(() => {
      router.refresh();
    });
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

    const email = inviteValues.email.trim().toLowerCase();

    setInviteError(null);
    setNotice(null);

    if (!email) {
      setInviteError("Enter an email address to send an invitation.");
      return;
    }

    setIsInviting(true);

    const result = await authClient.organization.inviteMember({
      email,
      role: inviteValues.role,
      organizationId: activeOrganization.id,
    });

    if (result.error) {
      setInviteError(
        getAuthErrorMessage(result.error, "Could not send the invitation."),
      );
      setIsInviting(false);
      return;
    }

    setInviteValues(initialInviteValues);
    setNotice(`Invitation sent to ${email}.`);
    setIsInviting(false);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (pendingInvitationId === invitationId) {
      return;
    }

    setPendingInvitationId(invitationId);
    setInviteError(null);
    setNotice(null);

    const result = await authClient.organization.cancelInvitation({
      invitationId,
    });

    if (result.error) {
      setInviteError(
        getAuthErrorMessage(result.error, "Could not cancel the invitation."),
      );
      setPendingInvitationId(null);
      return;
    }

    setNotice("Invitation canceled.");
    setPendingInvitationId(null);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization directory</CardTitle>
            <CardDescription>
              Switch the active tenant for the current session or create a new
              company workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {organizationsQuery.isPending ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
                Loading your organizations...
              </div>
            ) : organizations.length ? (
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
                      {isSwitching ? "Switching..." : isActive ? "Active" : "Set active"}
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
                No organizations yet. Create your first company workspace below
                to start using the app as a multi-tenant system.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create an organization</CardTitle>
            <CardDescription>
              Each organization becomes its own tenant context for membership,
              invitations, and future business data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateOrganization}>
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="organization-name">Company name</FieldLabel>
                  <Input
                    id="organization-name"
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
                </Field>
                <Field>
                  <FieldLabel htmlFor="organization-slug">Slug</FieldLabel>
                  <Input
                    id="organization-slug"
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
                  <FieldDescription>
                    Use a stable slug for deep links and future tenant-aware URLs.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="organization-logo">Logo URL</FieldLabel>
                  <Input
                    id="organization-logo"
                    placeholder="https://example.com/logo.png"
                    value={createValues.logo}
                    onChange={(event) =>
                      setCreateValues((currentValues) => ({
                        ...currentValues,
                        logo: event.target.value,
                      }))
                    }
                  />
                </Field>
                <FieldError>{createError}</FieldError>
                <Field>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create organization"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active organization</CardTitle>
            <CardDescription>
              The current tenant context drives invitations, membership, and the
              dashboard scope for this session.
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
                      Signed in as <span className="font-medium text-foreground">{activeMemberRole}</span>.
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
                    <p className="mt-2 text-2xl font-semibold capitalize">
                      {activeMemberRole}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
                No active organization yet. Pick one from the directory or create
                a new workspace first.
              </div>
            )}
            {notice ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
                {notice}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite members</CardTitle>
            <CardDescription>
              Send invitation links to teammates so they can join the active
              organization after signing in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canManageInvitations ? (
              <form className="space-y-4" onSubmit={handleInviteMember}>
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="ops@acme.com"
                      value={inviteValues.email}
                      onChange={(event) =>
                        setInviteValues((currentValues) => ({
                          ...currentValues,
                          email: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Role</FieldLabel>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(["member", "admin", "owner"] as const).map((role) => (
                        <Button
                          key={role}
                          type="button"
                          variant={
                            inviteValues.role === role ? "secondary" : "outline"
                          }
                          onClick={() =>
                            setInviteValues((currentValues) => ({
                              ...currentValues,
                              role,
                            }))
                          }
                        >
                          <span className="capitalize">{role}</span>
                        </Button>
                      ))}
                    </div>
                  </Field>
                  <FieldError>{inviteError}</FieldError>
                  <Field>
                    <Button
                      type="submit"
                      disabled={isInviting || !activeOrganization}
                    >
                      {isInviting ? "Sending invitation..." : "Send invitation"}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
                Only owners and admins can invite new members. Your current role is{" "}
                <span className="font-medium text-foreground">{activeMemberRole}</span>.
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
              activeOrganization.members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
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
                      Joined{" "}
                      {member.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="rounded-full border border-border/70 px-2 py-1 capitalize">
                      {member.role}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
                No members yet beyond the current owner.
              </div>
            )}
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
                        Role: <span className="capitalize">{invitation.role}</span>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={!canManageInvitations || isCanceling}
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
