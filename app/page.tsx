import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-8 dark:bg-black sm:px-6 sm:py-10">
      <main
        id="main-content"
        className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between rounded-[2rem] border border-black/5 bg-white px-6 py-16 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:items-start sm:px-10 sm:py-20 dark:border-white/10 dark:bg-zinc-950 dark:shadow-none lg:px-16 lg:py-24"
      >
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xl text-balance text-3xl font-semibold tracking-tight text-black dark:text-zinc-50 sm:text-4xl sm:leading-[1.1]">
            Next 16 starter with Better Auth, Drizzle, and Postgres wired in.
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-7 text-zinc-600 dark:text-zinc-400 sm:text-lg sm:leading-8">
            This starter now includes email and password auth backed by Better
            Auth, a Drizzle schema, and the Postgres service from Docker
            Compose. Log in, create an account, and land on a protected server
            component dashboard.
          </p>
          <p className="max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-500">
            Your first stop is still{" "}
            <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[0.95em] dark:bg-white/10">
              app/page.tsx
            </code>
            , but the project no longer reads like placeholder copy.
          </p>
          <p className="max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-500">
            Looking for a starting point? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-black hover:decoration-zinc-500 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:text-zinc-50 dark:decoration-zinc-700 dark:hover:text-white dark:hover:decoration-zinc-400 dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-black hover:decoration-zinc-500 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:text-zinc-50 dark:decoration-zinc-700 dark:hover:text-white dark:hover:decoration-zinc-400 dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex w-full flex-col gap-4 text-base font-medium sm:w-auto sm:flex-row">
          <Link
            className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:hover:bg-zinc-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-black sm:w-auto sm:min-w-40"
            href="/login"
          >
            Open Login
          </Link>
          <Link
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/10 px-5 text-zinc-950 transition-colors hover:border-black/20 hover:bg-black/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:border-white/15 dark:text-zinc-50 dark:hover:bg-white/[0.08] dark:focus-visible:ring-white dark:focus-visible:ring-offset-black sm:w-auto sm:min-w-40"
            href="/dashboard"
          >
            Open Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
