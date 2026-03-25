import type { ReactNode } from "react"
import { Suspense } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"

import { DashboardHeader } from "@/components/app/dashboard-header"
import { AppSidebar } from "@/components/app-sidebar"
import { auth } from "@/lib/auth"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

function DashboardLayoutFallback() {
  return (
    <div className="flex min-h-svh bg-background">
      <div className="hidden w-64 shrink-0 border-r bg-muted/30 lg:block" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-16 border-b bg-background/80" />
        <div className="flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-full max-w-6xl auto-rows-min gap-4 xl:grid-cols-3">
            <div className="aspect-[1.8/1] rounded-xl bg-muted/50" />
            <div className="aspect-[1.8/1] rounded-xl bg-muted/50" />
            <div className="aspect-[1.8/1] rounded-xl bg-muted/50" />
          </div>
        </div>
      </div>
    </div>
  )
}

async function DashboardLayoutContent({
  children,
}: {
  children: ReactNode
}) {
  await connection()

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <Suspense fallback={<DashboardLayoutFallback />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  )
}
