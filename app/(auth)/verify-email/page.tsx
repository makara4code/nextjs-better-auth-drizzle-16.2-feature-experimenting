import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { VerifyEmailForm } from "@/components/verify-email-form";
import { auth } from "@/lib/auth";
import { getSafeInternalPath } from "@/lib/redirects";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>
}) {
  await connection();
  const { from } = await searchParams;
  const destination = getSafeInternalPath(
    Array.isArray(from) ? from[0] : from,
    "/dashboard",
  );

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.emailVerified) {
    redirect(destination);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <VerifyEmailForm />
      </div>
    </div>
  );
}
