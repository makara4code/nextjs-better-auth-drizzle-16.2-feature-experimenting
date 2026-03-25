"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { authClient } from "@/lib/auth-client";

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
    <Button
      type="button"
      variant="primary"
      size="md"
      onPress={signOut}
      isDisabled={isPending}
    >
      {isPending ? "Signing Out..." : "Sign Out"}
    </Button>
  );
}
