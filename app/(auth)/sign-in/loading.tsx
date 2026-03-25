import { AuthFormSkeleton } from "@/components/auth-form-skeleton";

export default function SignInLoading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <AuthFormSkeleton
          title="Welcome back"
          description="Sign in with your Better Auth email and password."
          fields={[
            { label: "Email" },
            { label: "Password", hint: "Email sign-in" },
          ]}
          submitLabel="Sign In"
          separatorText="Or continue with"
          bottomPrompt="Need a new account?"
          bottomAction="Create one"
          showSocialButtons
          legalText="By clicking continue, you agree to our Terms of Service and Privacy Policy."
        />
      </div>
    </div>
  )
}
