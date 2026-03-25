"use client";

import { Button } from "@heroui/react";
import { RotateCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { refreshDashboardOverview } from "@/app/(app)/dashboard/actions";

export function RefreshDashboardButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleRefresh = async () => {
    if (isPending) {
      return;
    }

    setIsPending(true);
    await refreshDashboardOverview();
    startTransition(() => {
      router.refresh();
    });
    setIsPending(false);
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onPress={handleRefresh}
      isDisabled={isPending}
      className="min-w-36 text-foreground"
    >
      <RotateCwIcon className={isPending ? "animate-spin" : undefined} />
      {isPending ? "Refreshing..." : "Refresh data"}
    </Button>
  );
}
