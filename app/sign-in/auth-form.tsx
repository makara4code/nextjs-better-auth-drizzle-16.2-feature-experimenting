"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
} from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { authClient } from "../../lib/auth-client";

type Mode = "sign-in" | "sign-up";

const initialValues = {
  name: "",
  email: "",
  password: "",
};

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [values, setValues] = useState(initialValues);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nameInputId = "auth-name";
  const emailInputId = "auth-email";
  const passwordInputId = "auth-password";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    setMessage(null);

    const result =
      mode === "sign-up"
        ? await authClient.signUp.email({
            name: values.name,
            email: values.email,
            password: values.password,
          })
        : await authClient.signIn.email({
            email: values.email,
            password: values.password,
          });

    if (result.error) {
      setError(result.error.message ?? "Something went wrong.");
      setIsPending(false);
      return;
    }

    setMessage(
      mode === "sign-up"
        ? "Account created. Redirecting to your dashboard..."
        : "Signed in. Redirecting to your dashboard...",
    );
    setValues(initialValues);
    startTransition(() => {
      router.replace("/dashboard");
      router.refresh();
    });
    setIsPending(false);
  };

  return (
    <Card className="w-full max-w-md border border-black/5 bg-white/95 shadow-2xl shadow-black/10 dark:border-white/10 dark:bg-zinc-950/95">
      <CardHeader className="gap-4 border-b border-black/5 pb-6 dark:border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Better Auth
            </p>
            <CardTitle className="mt-2 text-3xl text-black dark:text-zinc-50">
              {mode === "sign-in" ? "Login" : "Create Account"}
            </CardTitle>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onPress={() => {
              setMode((currentMode) =>
                currentMode === "sign-in" ? "sign-up" : "sign-in",
              );
              setError(null);
              setMessage(null);
            }}
          >
            {mode === "sign-in" ? "Need an account?" : "Have an account?"}
          </Button>
        </div>
        <CardDescription className="max-w-lg text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Use your email and password to access the dashboard. This auth surface
          now runs fully on HeroUI components.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {mode === "sign-up" ? (
            <label className="block" htmlFor={nameInputId}>
              <span className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Name
              </span>
              <Input
                id={nameInputId}
                required
                type="text"
                name="name"
                autoComplete="name"
                value={values.name}
                onChange={(event) =>
                  setValues((currentValues) => ({
                    ...currentValues,
                    name: event.target.value,
                  }))
                }
                variant="primary"
                fullWidth
                className="rounded-2xl"
                placeholder="Jane Doe..."
              />
            </label>
          ) : null}

          <label className="block" htmlFor={emailInputId}>
            <span className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Email
            </span>
            <Input
              id={emailInputId}
              required
              type="email"
              name="email"
              autoComplete="email"
              spellCheck={false}
              value={values.email}
              onChange={(event) =>
                setValues((currentValues) => ({
                  ...currentValues,
                  email: event.target.value,
                }))
              }
              variant="secondary"
              fullWidth
              className="rounded-2xl"
              placeholder="jane@example.com..."
            />
          </label>

          <label className="block" htmlFor={passwordInputId}>
            <span className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Password
            </span>
            <Input
              id={passwordInputId}
              required
              type="password"
              name="password"
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
              value={values.password}
              onChange={(event) =>
                setValues((currentValues) => ({
                  ...currentValues,
                  password: event.target.value,
                }))
              }
              variant="secondary"
              fullWidth
              className="rounded-2xl"
              placeholder="At least 8 characters..."
            />
          </label>

          {error ? (
            <p aria-live="polite" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}

          {message ? (
            <p aria-live="polite" className="text-sm text-emerald-600">
              {message}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            isDisabled={isPending}
          >
            {isPending
              ? mode === "sign-in"
                ? "Signing In..."
                : "Creating Account..."
              : mode === "sign-in"
                ? "Login"
                : "Create Account"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="border-t border-black/5 pt-6 dark:border-white/10">
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          After signing in, you&apos;ll land on a protected dashboard rendered
          by a server component. Head back{" "}
          <Link
            href="/"
            className="font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-black hover:decoration-zinc-500 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:text-zinc-50 dark:decoration-zinc-700 dark:hover:text-white dark:hover:decoration-zinc-400 dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
          >
            home
          </Link>
          .
        </p>
      </CardFooter>
    </Card>
  );
}
