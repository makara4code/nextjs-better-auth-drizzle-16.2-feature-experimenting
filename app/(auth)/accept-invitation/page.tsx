import { Suspense } from "react";

import { AcceptInvitationPanel } from "@/components/organizations/accept-invitation-panel";

function AcceptInvitationFallback() {
  return (
    <div className="w-full max-w-xl">
      <div className="rounded-xl border border-border/70 bg-card px-6 py-8 text-center text-sm text-muted-foreground shadow-xs">
        Loading invitation...
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <Suspense fallback={<AcceptInvitationFallback />}>
        <div className="w-full max-w-xl">
          <AcceptInvitationPanel />
        </div>
      </Suspense>
    </div>
  );
}
