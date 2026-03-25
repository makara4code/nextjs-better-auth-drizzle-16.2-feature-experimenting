import { desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ShieldUserIcon } from "lucide-react";

import { stopImpersonatingAction } from "@/app/(app)/admin/actions";
import { PlatformUsersTable } from "@/components/admin/platform-users-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { member, organization, user } from "@/db/schema";
import {
  getRequiredSession,
  hasPlatformPermission,
} from "@/lib/auth/guards";
import {
  getPlatformRoleLabel,
  normalizePlatformRole,
} from "@/lib/auth/permissions";

export default async function AdminPage() {
  const canListUsers = await hasPlatformPermission({
    user: ["list"],
  });

  if (!canListUsers) {
    redirect("/dashboard");
  }

  const { session } = await getRequiredSession();
  const canSetRole = await hasPlatformPermission({
    user: ["set-role"],
  });
  const canBanUsers = await hasPlatformPermission({
    user: ["ban"],
  });
  const canRevokeSessions = await hasPlatformPermission({
    session: ["revoke"],
  });

  const users = await db.select().from(user).orderBy(desc(user.createdAt)).limit(50);
  const memberships = users.length
    ? await db
        .select({
          userId: member.userId,
          membershipRole: member.role,
          organizationId: organization.id,
          organizationName: organization.name,
          organizationSlug: organization.slug,
        })
        .from(member)
        .innerJoin(organization, eq(member.organizationId, organization.id))
        .where(inArray(member.userId, users.map((user) => user.id)))
    : [];

  const membershipsByUserId = memberships.reduce<
    Record<
      string,
      Array<{
        organizationId: string;
        organizationName: string;
        organizationSlug: string;
        membershipRole: string;
      }>
    >
  >((accumulator, membership) => {
    const nextMembership = {
      organizationId: membership.organizationId,
      organizationName: membership.organizationName,
      organizationSlug: membership.organizationSlug,
      membershipRole: membership.membershipRole,
    };

    accumulator[membership.userId] = [
      ...(accumulator[membership.userId] ?? []),
      nextMembership,
    ];

    return accumulator;
  }, {});

  const tableUsers = users.map((userRecord) => ({
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
    role: userRecord.role,
    emailVerified: userRecord.emailVerified,
    banned: Boolean(userRecord.banned),
    banReason: userRecord.banReason,
    banExpires: userRecord.banExpires?.toISOString() ?? null,
    createdAt: userRecord.createdAt?.toISOString() ?? null,
    memberships: membershipsByUserId[userRecord.id] ?? [],
    isCurrentUser: userRecord.id === session.user.id,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Platform Admin</h1>
          <p className="text-sm text-muted-foreground">
            Internal operator surface for platform-wide user moderation and role
            administration. Customer organization admins do not inherit this area.
          </p>
        </div>
        <div className="rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
          Signed in as{" "}
          <span className="font-medium text-foreground">
            {getPlatformRoleLabel(normalizePlatformRole(session.user.role))}
          </span>
        </div>
      </div>

      {session.session.impersonatedBy ? (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldUserIcon className="size-4 text-primary" />
              <CardTitle className="text-base">Impersonation active</CardTitle>
            </div>
            <CardDescription>
              This session is currently impersonating another user. Stop impersonation
              before changing platform roles or moderation state.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={stopImpersonatingAction}>
              <Button type="submit" variant="outline">
                Stop impersonating
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total users</CardDescription>
            <CardTitle className="text-3xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Platform operators</CardDescription>
            <CardTitle className="text-3xl">
              {users.filter((user) => Boolean(normalizePlatformRole(user.role))).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Banned users</CardDescription>
            <CardTitle className="text-3xl">
              {users.filter((user) => Boolean(user.banned)).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <PlatformUsersTable
        canBanUsers={canBanUsers}
        canRevokeSessions={canRevokeSessions}
        canSetRole={canSetRole}
        users={tableUsers}
      />
    </div>
  );
}
