"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { authClient } from "../../lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const signOut = async () => {
    setIsPending(true);
    await authClient.signOut();
    startTransition(() => {
      router.replace("/sign-in");
      router.refresh();
    });
    setIsPending(false);
  };

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={isPending}
      className="flex h-12 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-zinc-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
    >
      {isPending ? "Signing Out…" : "Sign Out"}
    </button>
  );
}
