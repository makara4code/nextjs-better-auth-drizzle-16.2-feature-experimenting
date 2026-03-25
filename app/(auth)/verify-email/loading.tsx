import { AuthFormSkeleton } from "@/components/auth-form-skeleton";

export default function VerifyEmailLoading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <AuthFormSkeleton
          title="Verify your email"
          description="Enter the 6-digit code from your inbox to finish setting up your access."
          fields={[
            { label: "Email" },
            { label: "Verification code", hint: "Mailpit friendly" },
          ]}
          submitLabel="Verify Email"
          separatorText="Need something else?"
          bottomPrompt="Already verified?"
          bottomAction="Return to sign in"
          legalText="Need a new account? Create one."
        />
      </div>
    </div>
  );
}
