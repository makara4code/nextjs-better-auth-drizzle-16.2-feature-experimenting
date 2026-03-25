import { AuthFormSkeleton } from "@/components/auth-form-skeleton";

export default function SignUpLoading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <AuthFormSkeleton
          title="Create your account"
          description="Sign up with your name, email, and password to start using the dashboard."
          fields={[
            { label: "Name" },
            { label: "Email" },
            { label: "Password", hint: "New account" },
          ]}
          submitLabel="Create Account"
          separatorText="Already have an account?"
          bottomPrompt=""
          bottomAction="Sign in instead"
          legalText="By creating an account, you agree to our Terms of Service and Privacy Policy."
        />
      </div>
    </div>
  )
}
