export default function SignInLoading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="grid md:grid-cols-2">
            <div className="space-y-6 p-6 md:p-8">
              <div className="space-y-2 text-center md:text-left">
                <div className="h-7 w-40 rounded bg-muted" />
                <div className="h-4 w-56 rounded bg-muted" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-4 w-16 rounded bg-muted" />
                  <div className="h-10 rounded bg-muted" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 rounded bg-muted" />
                  <div className="h-10 rounded bg-muted" />
                </div>
                <div className="h-10 rounded bg-muted" />
              </div>
            </div>
            <div className="hidden bg-muted/60 md:block" />
          </div>
        </div>
      </div>
    </div>
  )
}
