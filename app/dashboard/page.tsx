import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "../../lib/auth";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black sm:px-6">
      <section className="w-full max-w-2xl rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-zinc-950 dark:shadow-none">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Protected Route
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Welcome back, {session.user.name}
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Better Auth is issuing your session from the Postgres-backed Drizzle
          adapter. This page is protected in a server component by
          `auth.api.getSession`.
        </p>

        <dl className="mt-8 grid gap-4 rounded-3xl bg-zinc-50 p-5 dark:bg-zinc-900">
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Name
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {session.user.name}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Email
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {session.user.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              User ID
            </dt>
            <dd className="mt-1 break-words font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {session.user.id}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/"
            className="flex h-12 items-center justify-center rounded-full border border-black/10 px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:border-white/15 dark:text-zinc-50 dark:hover:bg-white/[0.08] dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
          >
            Back Home
          </Link>
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
