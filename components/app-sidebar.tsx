import * as React from "react";
import {
  BriefcaseBusinessIcon,
  Building2Icon,
  LayoutDashboardIcon,
  Settings2Icon,
  ShieldIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { AppShellState } from "@/lib/auth/capabilities";
import type { NavigationPreviewNode } from "@/lib/navigation";

const iconMap = {
  admin: <ShieldIcon />,
  dashboard: <LayoutDashboardIcon />,
  organization: <Building2Icon />,
  project: <BriefcaseBusinessIcon />,
  settings: <Settings2Icon />,
} as const;

function mapNavigationToSidebarItems(nodes: NavigationPreviewNode[]) {
  return nodes.map((node) => ({
    title: node.title,
    url: node.href ?? "",
    icon: node.icon ? iconMap[node.icon] : undefined,
    items: node.children?.map((child) => ({
      title: child.title,
      url: child.href ?? "",
    })),
  }));
}

export function AppSidebar({
  user,
  navigation,
  organizations,
  activeOrganization,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    image?: string | null;
    role?: string | null;
  };
  navigation: NavigationPreviewNode[];
  organizations: AppShellState["organizations"];
  activeOrganization: AppShellState["activeOrganization"];
}) {
  const navMain = mapNavigationToSidebarItems(navigation).filter(
    (item) => item.url || item.items?.length,
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher
          organizations={organizations}
          activeOrganization={activeOrganization}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
