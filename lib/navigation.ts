import type {
  OrganizationPermissionMap,
  PlatformPermissionMap,
} from "@/lib/auth/permissions";

export type NavigationIcon =
  | "dashboard"
  | "organization"
  | "project"
  | "settings"
  | "admin";

export type NavigationScope = "personal" | "organization" | "platform";

export type AppNavigationNode = {
  id: string;
  title: string;
  href?: string;
  icon?: NavigationIcon;
  scope: NavigationScope;
  description: string;
  requiresActiveOrganization?: boolean;
  organizationPermissions?: OrganizationPermissionMap;
  platformPermissions?: PlatformPermissionMap;
  permissionResource?: keyof OrganizationPermissionMap;
  children?: AppNavigationNode[];
};

export type NavigationPreviewNode = AppNavigationNode & {
  visible: boolean;
  visibleReason:
    | "always"
    | "active-organization"
    | "permission"
    | "child";
  children?: NavigationPreviewNode[];
};

export const appNavigation = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    scope: "organization",
    requiresActiveOrganization: true,
    description:
      "Organization-scoped overview and workspace analytics for the current tenant.",
  },
  {
    id: "organizations",
    title: "Organizations",
    icon: "organization",
    scope: "personal",
    description:
      "Switch workspaces, manage members and invitations, and open org access control.",
    children: [
      {
        id: "organizations-workspace",
        title: "Workspace",
        href: "/organizations/workspace",
        scope: "personal",
        description:
          "Choose the active organization, invite members, and manage workspace membership.",
      },
      {
        id: "organizations-access-control",
        title: "Access Control",
        href: "/organizations/access-control",
        scope: "organization",
        requiresActiveOrganization: true,
        organizationPermissions: {
          ac: ["read"],
        },
        permissionResource: "ac",
        description:
          "Review role definitions and understand which modules appear for each org role.",
      },
    ],
  },
  {
    id: "projects",
    title: "Projects",
    href: "/projects",
    icon: "project",
    scope: "organization",
    requiresActiveOrganization: true,
    organizationPermissions: {
      project: ["read"],
    },
    permissionResource: "project",
    description:
      "Tenant-scoped projects module. Visibility depends on the project read permission.",
  },
  {
    id: "settings",
    title: "Settings",
    icon: "settings",
    scope: "personal",
    description: "Personal application preferences that live outside org RBAC.",
    children: [
      {
        id: "settings-appearance",
        title: "Appearance",
        href: "/settings",
        scope: "personal",
        description: "Theme presets and personal visual preferences.",
      },
    ],
  },
  {
    id: "admin",
    title: "Global Admin",
    href: "/admin",
    icon: "admin",
    scope: "platform",
    platformPermissions: {
      user: ["list"],
    },
    description:
      "Internal platform administration for global operators only.",
  },
] satisfies AppNavigationNode[];

type EvaluateVisibilityOptions = {
  hasActiveOrganization: boolean;
  hasOrganizationPermission: (permissions: OrganizationPermissionMap) => boolean;
  hasPlatformPermission: (permissions: PlatformPermissionMap) => boolean;
};

function evaluateNodeVisibility(
  node: AppNavigationNode,
  options: EvaluateVisibilityOptions,
): Pick<NavigationPreviewNode, "visible" | "visibleReason"> {
  if (node.scope === "personal") {
    return {
      visible: true,
      visibleReason: "always",
    };
  }

  if (node.scope === "organization") {
    if (!options.hasActiveOrganization || node.requiresActiveOrganization) {
      if (!options.hasActiveOrganization) {
        return {
          visible: false,
          visibleReason: "active-organization",
        };
      }
    }

    if (node.organizationPermissions) {
      return {
        visible: options.hasOrganizationPermission(node.organizationPermissions),
        visibleReason: "permission",
      };
    }

    return {
      visible: true,
      visibleReason: "active-organization",
    };
  }

  if (node.platformPermissions) {
    return {
      visible: options.hasPlatformPermission(node.platformPermissions),
      visibleReason: "permission",
    };
  }

  return {
    visible: false,
    visibleReason: "permission",
  };
}

export function buildNavigationPreview(
  nodes: AppNavigationNode[],
  options: EvaluateVisibilityOptions,
): NavigationPreviewNode[] {
  return nodes.map((node) => {
    const childPreview = node.children
      ? buildNavigationPreview(node.children, options)
      : undefined;
    const ownVisibility = evaluateNodeVisibility(node, options);
    const childVisible = Boolean(childPreview?.some((child) => child.visible));

    if (!ownVisibility.visible && childVisible) {
      return {
        ...node,
        children: childPreview,
        visible: true,
        visibleReason: "child",
      };
    }

    return {
      ...node,
      children: childPreview,
      visible: ownVisibility.visible,
      visibleReason: ownVisibility.visibleReason,
    };
  });
}

export function filterNavigationPreview(
  preview: NavigationPreviewNode[],
): NavigationPreviewNode[] {
  return preview
    .filter((node) => node.visible)
    .map((node) => ({
      ...node,
      children: node.children ? filterNavigationPreview(node.children) : undefined,
    }));
}

export function flattenNavigationPreview(
  preview: NavigationPreviewNode[],
): NavigationPreviewNode[] {
  return preview.flatMap((node) => [
    node,
    ...(node.children ? flattenNavigationPreview(node.children) : []),
  ]);
}

export function flattenNavigationNodes(nodes: AppNavigationNode[]): AppNavigationNode[] {
  return nodes.flatMap((node) => [
    node,
    ...(node.children ? flattenNavigationNodes(node.children) : []),
  ]);
}
