"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const initialValues = {
  email: "",
  otp: "",
};

function getQueryValue(value: string | null) {
  return value?.trim() ?? "";
}

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

export function VerifyEmailForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const presetEmail = getQueryValue(searchParams.get("email"));
  const isFromBlockedSignIn = searchParams.get("reason") === "unverified";
  const showSentNotice = searchParams.get("sent") === "1";

  useEffect(() => {
    if (!presetEmail) {
      return;
    }

    setValues((currentValues) =>
      currentValues.email
        ? currentValues
        : {
            ...currentValues,
            email: presetEmail,
          }
    );
  }, [presetEmail]);

  useEffect(() => {
    if (showSentNotice && presetEmail) {
      setNotice(`We sent a verification code to ${presetEmail}.`);
      return;
    }

    if (isFromBlockedSignIn && presetEmail) {
      setNotice(
        `Your email still needs verification. Enter the latest code sent to ${presetEmail}.`
      );
      return;
    }

    setNotice(null);
  }, [isFromBlockedSignIn, presetEmail, showSentNotice]);

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = values.email.trim().toLowerCase();
    const otp = values.otp.trim();

    setError(null);
    setNotice(null);

    if (!email || !otp) {
      setError("Enter both your email address and verification code.");
      return;
    }

    setIsVerifying(true);

    const result = await authClient.emailOtp.verifyEmail({
      email,
      otp,
    });

    if (result.error) {
      setError(getAuthErrorMessage(result.error, "Could not verify your code."));
      setIsVerifying(false);
      return;
    }

    setValues({
      email,
      otp: "",
    });
    setNotice("Email verified. Redirecting to your dashboard...");
    startTransition(() => {
      router.replace("/redirecting?to=%2Fdashboard");
    });
    setIsVerifying(false);
  };

  const handleResend = async () => {
    const email = values.email.trim().toLowerCase();

    setError(null);
    setNotice(null);

    if (!email) {
      setError("Enter your email address before requesting a new code.");
      return;
    }

    setIsResending(true);

    const result = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });

    if (result.error) {
      setError(
        getAuthErrorMessage(result.error, "We could not send another code yet.")
      );
      setIsResending(false);
      return;
    }

    setNotice(`A fresh verification code was sent to ${email}.`);
    setIsResending(false);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleVerify}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Verify your email</h1>
                <p className="text-balance text-muted-foreground">
                  Enter the 6-digit code from your inbox to finish setting up
                  your access.
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  autoComplete="email"
                  required
                  spellCheck={false}
                  value={values.email}
                  onChange={(event) =>
                    setValues((currentValues) => ({
                      ...currentValues,
                      email: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="otp">Verification code</FieldLabel>
                  <span className="ml-auto text-sm text-muted-foreground">
                    Mailpit friendly
                  </span>
                </div>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  required
                  maxLength={6}
                  value={values.otp}
                  onChange={(event) =>
                    setValues((currentValues) => ({
                      ...currentValues,
                      otp: event.target.value.replace(/\s+/g, ""),
                    }))
                  }
                />
              </Field>

              {notice ? (
                <FieldDescription className="text-center">{notice}</FieldDescription>
              ) : null}

              <FieldError>{error}</FieldError>

              <Field className="grid gap-3 sm:grid-cols-2">
                <Button type="submit" disabled={isVerifying || isResending}>
                  {isVerifying ? "Verifying..." : "Verify Email"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isVerifying || isResending}
                  onClick={handleResend}
                >
                  {isResending ? "Sending..." : "Resend Code"}
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Need something else?
              </FieldSeparator>

              <FieldDescription className="text-center">
                Already verified?{" "}
                <Link href="/sign-in" className="underline underline-offset-4">
                  Return to sign in
                </Link>
                .
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="relative hidden bg-muted md:block">
            <img
              src="https://ui.shadcn.com/placeholder.svg"
              alt="Abstract workspace preview"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        Need a new account?{" "}
        <Link href="/sign-up" className="underline underline-offset-4">
          Create one
        </Link>
        .
      </FieldDescription>
    </div>
  );
}
