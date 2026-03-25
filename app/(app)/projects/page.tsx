import { BadgeCheckIcon, ShieldAlertIcon } from "lucide-react";

import { ProjectsTable } from "@/components/projects/projects-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getRequiredActiveOrganization,
  hasOrgPermission,
} from "@/lib/auth/guards";
import { type ProjectStatus } from "@/lib/project-constants";
import { getProjectsForOrganization } from "@/lib/projects";

export default async function ProjectsPage() {
  const { organization } = await getRequiredActiveOrganization();
  const canReadProjects = await hasOrgPermission(
    {
      project: ["read"],
    },
    organization.id,
  );
  const canCreateProjects = await hasOrgPermission(
    {
      project: ["create"],
    },
    organization.id,
  );
  const canUpdateProjects = await hasOrgPermission(
    {
      project: ["update"],
    },
    organization.id,
  );
  const canDeleteProjects = await hasOrgPermission(
    {
      project: ["delete"],
    },
    organization.id,
  );
  const projects = canReadProjects
    ? await getProjectsForOrganization(organization.id)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            The first tenant-scoped business module. Every project read and
            write is bound to{" "}
            <span className="font-medium text-foreground">
              {organization.name}
            </span>
            .
          </p>
        </div>
        <div className="rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
          Active organization:{" "}
          <span className="font-medium text-foreground">
            {organization.slug}
          </span>
        </div>
      </div>

      {canReadProjects ? (
        <>
          <ProjectsTable
            canCreateProjects={canCreateProjects}
            canDeleteProjects={canDeleteProjects}
            canUpdateProjects={canUpdateProjects}
            projects={projects.map((project) => ({
              id: project.id,
              slug: project.slug,
              name: project.name,
              description: project.description,
              status: project.status as ProjectStatus,
              createdByName: project.createdByName,
              createdByEmail: project.createdByEmail,
              updatedAt: project.updatedAt.toISOString(),
            }))}
          />
        </>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlertIcon className="size-5 text-destructive" />
              <CardTitle>Projects are restricted</CardTitle>
            </div>
            <CardDescription>
              Your current role in {organization.name} does not include the
              `project:read` permission.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Ask an org admin or org superadmin to grant a role with project
            access or create a custom role that includes the project read
            permission.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
