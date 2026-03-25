"use client";

import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  Building2Icon,
  CheckIcon,
  ChevronsUpDownIcon,
  PlusIcon,
} from "lucide-react";
import type { AppShellState } from "@/lib/auth/capabilities";

function getAuthErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const authError = error as {
    message?: string;
    error?: {
      message?: string;
    };
  };

  return authError.message ?? authError.error?.message ?? fallback;
}

export function OrganizationSwitcher({
  organizations,
  activeOrganization,
}: {
  organizations: AppShellState["organizations"];
  activeOrganization: AppShellState["activeOrganization"];
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingOrganizationId, setPendingOrganizationId] = useState<
    string | null
  >(null);

  const currentOrganization = useMemo(() => {
    if (activeOrganization) {
      return activeOrganization;
    }

    return organizations?.[0] ?? null;
  }, [activeOrganization, organizations]);

  const handleSetActiveOrganization = async (organizationId: string) => {
    if (pendingOrganizationId === organizationId) {
      return;
    }

    setPendingOrganizationId(organizationId);
    setError(null);

    const result = await authClient.organization.setActive({
      organizationId,
    });

    if (result.error) {
      setError(
        getAuthErrorMessage(result.error, "Could not switch organizations."),
      );
      setPendingOrganizationId(null);
      return;
    }

    startTransition(() => {
      router.refresh();
    });
    setPendingOrganizationId(null);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Building2Icon className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {currentOrganization?.name ?? "No organization"}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                {currentOrganization?.slug ?? "Create your first workspace"}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-60 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Organizations
              </DropdownMenuLabel>
              {organizations.length ? (
                organizations.map((organization) => {
                  const isActive = activeOrganization?.id === organization.id;
                  const isSwitching = pendingOrganizationId === organization.id;

                  return (
                    <DropdownMenuItem
                      key={organization.id}
                      className={cn("gap-2 p-2", isActive && "bg-muted/60")}
                      onClick={() =>
                        isActive
                          ? undefined
                          : handleSetActiveOrganization(organization.id)
                      }
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border border-border/70 bg-background">
                        {isActive ? (
                          <CheckIcon className="size-3.5" />
                        ) : (
                          <Building2Icon className="size-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {organization.name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {organization.slug}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isSwitching
                          ? "Switching..."
                          : isActive
                            ? "Active"
                            : "Open"}
                      </span>
                    </DropdownMenuItem>
                  );
                })
              ) : (
                <DropdownMenuItem disabled>
                  No organizations yet.
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => router.push("/organizations/workspace")}
              >
                <div className="flex size-6 items-center justify-center rounded-md border border-dashed border-border/70 bg-transparent">
                  <PlusIcon className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Manage organizations
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {error ? (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-destructive">{error}</div>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
