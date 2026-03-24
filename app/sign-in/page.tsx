import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "../../lib/auth";
import { AuthForm } from "./auth-form";

export default async function SignInPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black sm:px-6">
      <AuthForm />
    </div>
  );
}
