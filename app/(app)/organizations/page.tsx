import { OrganizationSettingsPanel } from "@/components/organizations/organization-settings-panel";

export default function OrganizationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
        <p className="text-sm text-muted-foreground">
          Manage company workspaces, switch the active tenant, and invite
          members into each organization.
        </p>
      </div>
      <OrganizationSettingsPanel />
    </div>
  );
}
