"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

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
  name: "",
  email: "",
  password: "",
};

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    setMessage(null);

    const result = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    if (result.error) {
      setError(result.error.message ?? "Something went wrong.");
      setIsPending(false);
      return;
    }

    setMessage("Account created. Redirecting to your dashboard...");
    setValues(initialValues);
    startTransition(() => {
      router.replace("/dashboard");
      router.refresh();
    });
    setIsPending(false);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-balance text-muted-foreground">
                  Sign up with your name, email, and password to start using
                  the dashboard.
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  autoComplete="name"
                  required
                  value={values.name}
                  onChange={(event) =>
                    setValues((currentValues) => ({
                      ...currentValues,
                      name: event.target.value,
                    }))
                  }
                />
              </Field>

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
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <span className="ml-auto text-sm text-muted-foreground">
                    New account
                  </span>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={values.password}
                  onChange={(event) =>
                    setValues((currentValues) => ({
                      ...currentValues,
                      password: event.target.value,
                    }))
                  }
                />
              </Field>

              <FieldError>{error}</FieldError>
              {message ? (
                <FieldDescription className="text-center text-emerald-600">
                  {message}
                </FieldDescription>
              ) : null}

              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating account..." : "Create Account"}
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Already have an account?
              </FieldSeparator>

              <FieldDescription className="text-center">
                <Link href="/sign-in" className="underline underline-offset-4">
                  Sign in instead
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
        By creating an account, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
