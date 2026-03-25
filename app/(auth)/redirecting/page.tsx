"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function getSafeDestination(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function RedirectingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const destination = getSafeDestination(searchParams.get("to"));

    router.replace(destination);
  }, [router, searchParams]);

  return null;
}

function RedirectingMessage() {
  return (
    <main
      id="main-content"
      className="flex min-h-svh items-center justify-center bg-white px-6 py-10 text-black dark:bg-black dark:text-white"
    >
      <p
        aria-live="polite"
        className="text-center text-base font-medium"
      >
        Redirecting...
      </p>
    </main>
  );
}

export default function RedirectingPage() {
  return (
    <>
      <RedirectingMessage />
      <Suspense fallback={null}>
        <RedirectingContent />
      </Suspense>
    </>
  );
}
