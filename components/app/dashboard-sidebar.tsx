"use client";

import {
  Home,
  LayoutDashboard,
  LogIn,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/",
    label: "Overview",
    icon: Home,
    description: "Project landing page",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Protected server component",
  },
  {
    href: "/login",
    label: "Auth",
    icon: LogIn,
    description: "HeroUI login form",
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-80 shrink-0 border-r border-border/70 bg-card/70 lg:block">
      <div className="sticky top-0 flex h-screen flex-col gap-6 px-5 py-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
                App Shell
              </p>
              <h1 className="text-lg font-semibold tracking-tight">
                shadcn-first layout
              </h1>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Layout, navigation, and content framing live in the shadcn layer.
            Inputs and action controls stay in HeroUI.
          </p>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "rounded-2xl border border-transparent p-1 transition-colors",
                    isActive && "border-border/80 bg-muted/50",
                  )}
                >
                  <Button
                    className="h-auto w-full justify-start gap-3 px-3 py-3 text-left"
                    variant={isActive ? "secondary" : "ghost"}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {item.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                  </Button>
                </div>
              </Link>
            );
          })}
        </nav>

        <Card className="mt-auto border-dashed bg-background/80">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Current split</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LayoutDashboard className="size-4 text-primary" />
                shadcn
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Sidebar, cards, spacing rhythm, and dashboard framing.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UserRound className="size-4 text-primary" />
                HeroUI
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Buttons, inputs, and other direct user-interaction controls.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
