"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { createRedirectingRoute } from "@/lib/redirects";
import { cn } from "@/lib/utils";

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

export function AcceptInvitationPanel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const invitationId = searchParams.get("invitationId")?.trim() ?? "";
  const invitationPath = useMemo(
    () =>
      invitationId
        ? `/accept-invitation?invitationId=${encodeURIComponent(invitationId)}`
        : "/accept-invitation",
    [invitationId],
  );
  const signInHref = useMemo(
    () => `/sign-in?from=${encodeURIComponent(invitationPath)}`,
    [invitationPath],
  );
  const signUpHref = useMemo(
    () => `/sign-up?from=${encodeURIComponent(invitationPath)}`,
    [invitationPath],
  );
  const verifyHref = useMemo(() => {
    const params = new URLSearchParams({
      from: invitationPath,
    });

    if (session?.user.email) {
      params.set("email", session.user.email);
    }

    return `/verify-email?${params.toString()}`;
  }, [invitationPath, session?.user.email]);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleAcceptInvitation = async () => {
    if (!invitationId || isAccepting) {
      return;
    }

    setIsAccepting(true);
    setError(null);
    setNotice(null);

    const result = await authClient.organization.acceptInvitation({
      invitationId,
    });

    if (result.error) {
      setError(
        getAuthErrorMessage(result.error, "Could not accept the invitation."),
      );
      setIsAccepting(false);
      return;
    }

    setNotice("Invitation accepted. Redirecting to organizations...");
    startTransition(() => {
      router.replace(createRedirectingRoute("/organizations"));
    });
    setIsAccepting(false);
  };

  const handleRejectInvitation = async () => {
    if (!invitationId || isRejecting) {
      return;
    }

    setIsRejecting(true);
    setError(null);
    setNotice(null);

    const result = await authClient.organization.rejectInvitation({
      invitationId,
    });

    if (result.error) {
      setError(
        getAuthErrorMessage(result.error, "Could not decline the invitation."),
      );
      setIsRejecting(false);
      return;
    }

    setNotice("Invitation declined.");
    setIsRejecting(false);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="p-6 md:p-8">
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Organization invitation</h1>
              <p className="text-balance text-muted-foreground">
                Accept the invitation to join a company workspace and switch
                into its tenant context.
              </p>
            </div>

            {!invitationId ? (
              <FieldError>
                This invitation link is missing an invitation ID.
              </FieldError>
            ) : isSessionPending ? (
              <FieldDescription className="text-center">
                Checking your session...
              </FieldDescription>
            ) : !session ? (
              <>
                <FieldDescription className="text-center">
                  Sign in first so Better Auth can attach this invitation to your
                  account.
                </FieldDescription>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button nativeButton={false} render={<Link href={signInHref} />}>
                    Sign in
                  </Button>
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href={signUpHref} />}
                  >
                    Create account
                  </Button>
                </div>
              </>
            ) : !session.user.emailVerified ? (
              <>
                <FieldDescription className="text-center">
                  Verify your email before accepting this invitation.
                </FieldDescription>
                <Button nativeButton={false} render={<Link href={verifyHref} />}>
                  Verify email
                </Button>
              </>
            ) : (
              <>
                <FieldDescription className="text-center">
                  You are signed in as{" "}
                  <span className="font-medium text-foreground">
                    {session.user.email}
                  </span>
                  .
                </FieldDescription>
                {notice ? (
                  <FieldDescription className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-foreground">
                    {notice}
                  </FieldDescription>
                ) : null}
                <FieldError>{error}</FieldError>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    disabled={isAccepting || isRejecting}
                    onClick={handleAcceptInvitation}
                  >
                    {isAccepting ? "Accepting..." : "Accept invitation"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    disabled={isAccepting || isRejecting}
                    onClick={handleRejectInvitation}
                  >
                    {isRejecting ? "Declining..." : "Decline"}
                  </Button>
                </div>
              </>
            )}
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
