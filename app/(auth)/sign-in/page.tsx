import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"

import { auth } from "@/lib/auth"
import { SignInForm } from "@/components/login-form"

export default async function SignInPage() {
  await connection()

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignInForm />
      </div>
    </div>
  )
}
