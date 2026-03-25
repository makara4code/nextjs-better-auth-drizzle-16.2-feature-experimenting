"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import {
  createOrganizationRoleAction,
  deleteOrganizationRoleAction,
  updateOrganizationRoleAction,
} from "@/app/(app)/organizations/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DynamicOrganizationRole } from "@/lib/auth/hierarchy";
import {
  getOrganizationRoleLabel,
  isBuiltInOrganizationRole,
  isPermissionMapSubset,
  organizationPermissionCatalog,
  organizationRoleOptions,
  organizationRoles,
} from "@/lib/auth/permissions";
import {
  appNavigation,
  buildNavigationPreview,
  flattenNavigationPreview,
  type NavigationPreviewNode,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  AlertCircleIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  ShieldCheckIcon,
} from "lucide-react";

type AccessControlPanelProps = {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  actorRole: string;
  dynamicRoles: DynamicOrganizationRole[];
  canCreateRoles: boolean;
  canUpdateRoles: boolean;
  canDeleteRoles: boolean;
};

type PermissionRecord = Record<string, string[]>;

function getReasonLabel(reason: NavigationPreviewNode["visibleReason"]) {
  switch (reason) {
    case "always":
      return "Always visible";
    case "active-organization":
      return "Visible with active organization";
    case "permission":
      return "Visible by permission";
    case "child":
      return "Visible through child access";
    default:
      return "Visibility resolved";
  }
}

function getRolePermission(role: string, dynamicRoles: DynamicOrganizationRole[]) {
  if (isBuiltInOrganizationRole(role)) {
    return organizationRoles[role].statements as PermissionRecord;
  }

  return (
    dynamicRoles.find((candidate) => candidate.role === role)?.permission ?? {}
  );
}

function renderTree(
  nodes: NavigationPreviewNode[],
  depth: number,
  selectedNodeId: string,
  onSelect: (nodeId: string) => void,
) {
  return nodes.map((node) => (
    <div key={node.id} className="grid gap-2">
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors",
          selectedNodeId === node.id
            ? "border-primary/40 bg-primary/5"
            : "border-border/70 bg-background hover:bg-muted/40",
        )}
        style={{
          marginLeft: `${depth * 16}px`,
        }}
      >
        <div className="min-w-0">
          <div className="font-medium text-foreground">{node.title}</div>
          <div className="truncate text-xs text-muted-foreground">
            {node.href ?? "Container"}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5",
              node.visible
                ? "border-primary/20 bg-primary/5 text-foreground"
                : "border-border/70 bg-muted/50 text-muted-foreground",
            )}
          >
            {node.visible ? "Visible" : "Hidden"}
          </span>
          {node.children?.length ? (
            <ChevronRightIcon className="size-3.5 text-muted-foreground" />
          ) : null}
        </div>
      </button>
      {node.children?.length ? (
        <div className="grid gap-2">
          {renderTree(node.children, depth + 1, selectedNodeId, onSelect)}
        </div>
      ) : null}
    </div>
  ));
}

export function AccessControlPanel(props: AccessControlPanelProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(props.actorRole);
  const [draftPermission, setDraftPermission] = useState<PermissionRecord>(() =>
    getRolePermission(props.actorRole, props.dynamicRoles),
  );
  const [selectedNodeId, setSelectedNodeId] = useState("dashboard");
  const [newRoleName, setNewRoleName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const roleDefinitions = useMemo(() => {
    const builtInRoles = organizationRoleOptions.map((role) => ({
      role: role.role,
      label: role.label,
      builtIn: true,
      description: role.description,
      permission: organizationRoles[role.role].statements as PermissionRecord,
    }));

    const customRoles = props.dynamicRoles
      .filter((role) => !organizationRoleOptions.some((option) => option.role === role.role))
      .map((role) => ({
        role: role.role,
        label: getOrganizationRoleLabel(role.role),
        builtIn: false,
        description: "Runtime custom role",
        permission: role.permission,
      }));

    return [...builtInRoles, ...customRoles];
  }, [props.dynamicRoles]);

  useEffect(() => {
    setDraftPermission(getRolePermission(selectedRole, props.dynamicRoles));
  }, [props.dynamicRoles, selectedRole]);

  const previewTree = useMemo(() => {
    const scopedNavigation = appNavigation.filter((node) => node.scope !== "platform");

    return buildNavigationPreview(scopedNavigation, {
      hasActiveOrganization: true,
      hasOrganizationPermission: (permissions) =>
        isPermissionMapSubset(permissions, draftPermission),
      hasPlatformPermission: () => false,
    });
  }, [draftPermission]);
  const flattenedPreview = useMemo(
    () => flattenNavigationPreview(previewTree),
    [previewTree],
  );

  const selectedNode = useMemo(
    () =>
      flattenedPreview.find((node: NavigationPreviewNode) => node.id === selectedNodeId) ??
      flattenedPreview[0],
    [flattenedPreview, selectedNodeId],
  );

  useEffect(() => {
    if (!selectedNode) {
      return;
    }

    setSelectedNodeId(selectedNode.id);
  }, [selectedNode]);

  const selectedRoleDefinition =
    roleDefinitions.find((role) => role.role === selectedRole) ?? roleDefinitions[0];
  const selectedResource = selectedNode?.permissionResource
    ? organizationPermissionCatalog.find(
        (resource) => resource.resource === selectedNode.permissionResource,
      )
    : null;

  const canEditSelectedRole =
    !selectedRoleDefinition?.builtIn && props.canUpdateRoles;
  const canDeleteSelectedRole =
    !selectedRoleDefinition?.builtIn && props.canDeleteRoles;

  const togglePermission = (resource: string, action: string) => {
    setDraftPermission((current) => {
      const currentActions = current[resource] ?? [];
      const nextActions = currentActions.includes(action)
        ? currentActions.filter((currentAction) => currentAction !== action)
        : [...currentActions, action];

      if (!nextActions.length) {
        const { [resource]: _removed, ...nextPermission } = current;
        return nextPermission;
      }

      return {
        ...current,
        [resource]: nextActions,
      };
    });
  };

  const handleSave = async () => {
    if (!selectedRoleDefinition || selectedRoleDefinition.builtIn) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);

    const result = await updateOrganizationRoleAction({
      roleName: selectedRoleDefinition.role,
      permission: draftPermission,
    });

    if (!result.success) {
      setError(result.error ?? "Could not update the selected custom role.");
      setIsSaving(false);
      return;
    }

    setNotice(result.notice ?? `Role ${selectedRoleDefinition.label} updated.`);
    startTransition(() => {
      router.refresh();
    });
    setIsSaving(false);
  };

  const handleCreate = async () => {
    const roleName = newRoleName.trim();
    if (!roleName) {
      setError("Enter a custom role name before saving.");
      return;
    }

    setIsCreating(true);
    setError(null);
    setNotice(null);

    const result = await createOrganizationRoleAction({
      role: roleName,
      permission: draftPermission,
    });

    if (!result.success) {
      setError(result.error ?? "Could not create the custom role.");
      setIsCreating(false);
      return;
    }

    setNewRoleName("");
    setSelectedRole(roleName);
    setNotice(result.notice ?? `Role ${roleName} created.`);
    startTransition(() => {
      router.refresh();
    });
    setIsCreating(false);
  };

  const handleDelete = async () => {
    if (!selectedRoleDefinition || selectedRoleDefinition.builtIn) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    setNotice(null);

    const result = await deleteOrganizationRoleAction({
      roleName: selectedRoleDefinition.role,
    });

    if (!result.success) {
      setError(result.error ?? "Could not delete the selected custom role.");
      setIsDeleting(false);
      return;
    }

    setSelectedRole(props.actorRole);
    setNotice(result.notice ?? `Role ${selectedRoleDefinition.label} deleted.`);
    startTransition(() => {
      router.refresh();
    });
    setIsDeleting(false);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.25fr)]">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Role preview tree</CardTitle>
            <CardDescription>
              Select a role, then inspect which modules stay visible in the sidebar for {props.organization.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {renderTree(previewTree, 0, selectedNodeId, setSelectedNodeId)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role selection</CardTitle>
            <CardDescription>
              Built-in roles are read-only templates. Custom roles can be edited at runtime.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Current role</span>
              <select
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
                className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
              >
                {roleDefinitions.map((role) => (
                  <option key={role.role} value={role.role}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">{selectedRoleDefinition?.label}</div>
              <div className="mt-1">{selectedRoleDefinition?.description}</div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                {selectedRoleDefinition?.builtIn ? (
                  <>
                    <LockIcon className="size-3.5" />
                    Built-in roles are fixed by the app configuration.
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="size-3.5" />
                    Custom roles can be updated and deleted here.
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{selectedNode?.title ?? "Module details"}</CardTitle>
            <CardDescription>{selectedNode?.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {selectedNode ? (
              <>
                <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border/70 px-2 py-0.5 text-xs text-muted-foreground">
                      Scope: {selectedNode.scope}
                    </span>
                    <span className="rounded-full border border-border/70 px-2 py-0.5 text-xs text-muted-foreground">
                      {getReasonLabel(selectedNode.visibleReason)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs",
                        selectedNode.visible
                          ? "border-primary/20 bg-primary/5 text-foreground"
                          : "border-border/70 bg-muted/50 text-muted-foreground",
                      )}
                    >
                      {selectedNode.visible ? "Visible now" : "Hidden now"}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {selectedNode.href ? (
                      <>
                        Route: <span className="font-medium text-foreground">{selectedNode.href}</span>
                      </>
                    ) : (
                      "Container module. Visibility can still be inherited from children."
                    )}
                  </div>
                </div>

                {selectedResource ? (
                  <div className="grid gap-3">
                    {selectedResource.actions.map((action) => {
                      const checked =
                        draftPermission[selectedResource.resource]?.includes(action.action) ?? false;

                      return (
                        <label
                          key={`${selectedResource.resource}:${action.action}`}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border border-border/70 px-4 py-3 text-sm",
                            canEditSelectedRole ? "bg-background" : "bg-muted/20 text-muted-foreground",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!canEditSelectedRole}
                            onChange={() =>
                              togglePermission(selectedResource.resource, action.action)
                            }
                          />
                          <span>{action.label}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                    This node does not map to editable org permissions. Its visibility is driven by route structure or always-on personal access.
                  </div>
                )}

                {!canEditSelectedRole ? (
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                    {selectedRoleDefinition?.builtIn
                      ? "Built-in roles are view-only here. Use the form below to create a custom role from the current permission draft."
                      : "Your current org role can review this role but cannot edit it."}
                  </div>
                ) : null}
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Save role changes</CardTitle>
            <CardDescription>
              Apply the current draft to a custom role or clone it into a brand-new role.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-3">
              <Button type="button" disabled={!canEditSelectedRole || isSaving} onClick={handleSave}>
                {isSaving ? "Saving..." : "Save selected custom role"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={!canDeleteSelectedRole || isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? "Deleting..." : "Delete selected custom role"}
              </Button>
            </div>

            <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4">
              <label className="grid gap-2 text-sm">
                <span className="font-medium">New custom role name</span>
                <Input
                  placeholder="finance-reviewer"
                  value={newRoleName}
                  onChange={(event) => setNewRoleName(event.target.value)}
                />
              </label>
              <Button type="button" disabled={!props.canCreateRoles || isCreating} onClick={handleCreate}>
                {isCreating ? "Creating..." : "Create custom role from this draft"}
              </Button>
              {!props.canCreateRoles ? (
                <p className="text-sm text-muted-foreground">
                  Your current org role can view access control but cannot create custom roles.
                </p>
              ) : null}
            </div>

            {notice ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
                {notice}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon className="size-4" />
                  {error}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visibility summary</CardTitle>
            <CardDescription>
              Quick explanation of why the selected module appears or stays hidden.
            </CardDescription>
          </CardHeader>
          <CardContent className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            {selectedNode?.visible ? (
              <div className="flex items-start gap-3">
                <EyeIcon className="mt-0.5 size-4 text-foreground" />
                <div>
                  <div className="font-medium text-foreground">
                    {selectedNode.title} is currently visible for {selectedRoleDefinition?.label}.
                  </div>
                  <div className="mt-1">
                    {selectedNode.visibleReason === "child"
                      ? "The parent stays visible because at least one child page remains accessible."
                      : `This node stays visible because it is ${getReasonLabel(selectedNode.visibleReason).toLowerCase()}.`}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <EyeOffIcon className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-foreground">
                    {selectedNode?.title} is hidden for {selectedRoleDefinition?.label}.
                  </div>
                  <div className="mt-1">
                    Grant the corresponding read permission or expose an accessible child page if you want this module to remain in the sidebar.
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
