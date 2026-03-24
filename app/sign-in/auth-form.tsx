"use client";

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
    <div className="w-full max-w-md rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-zinc-950 dark:shadow-none">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Better Auth
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            {mode === "sign-in" ? "Sign In" : "Create Account"}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setMode((currentMode) =>
              currentMode === "sign-in" ? "sign-up" : "sign-in",
            );
            setError(null);
            setMessage(null);
          }}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/[0.06] dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
        >
          {mode === "sign-in" ? "Need an account?" : "Have an account?"}
        </button>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        {mode === "sign-up" ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Name
            </span>
            <input
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
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none transition focus-visible:ring-2 focus-visible:ring-black dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-white"
              placeholder="Jane Doe…"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Email
          </span>
          <input
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
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none transition focus-visible:ring-2 focus-visible:ring-black dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-white"
            placeholder="jane@example.com…"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Password
          </span>
          <input
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
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none transition focus-visible:ring-2 focus-visible:ring-black dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-white"
            placeholder="At least 8 characters…"
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

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-zinc-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
        >
          {isPending
            ? mode === "sign-in"
              ? "Signing In…"
              : "Creating Account…"
            : mode === "sign-in"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        After signing in, you&apos;ll land on a protected dashboard rendered by
        a server component. Head back{" "}
        <Link
          href="/"
          className="font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-black hover:decoration-zinc-500 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:text-zinc-50 dark:decoration-zinc-700 dark:hover:text-white dark:hover:decoration-zinc-400 dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
        >
          home
        </Link>
        .
      </p>
    </div>
  );
}
