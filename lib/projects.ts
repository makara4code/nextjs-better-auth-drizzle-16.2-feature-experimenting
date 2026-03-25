import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { project, user } from "@/db/schema";
import { projectStatusOptions } from "@/lib/project-constants";

export function slugifyProjectName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function getProjectsForOrganization(organizationId: string) {
  return db
    .select({
      id: project.id,
      organizationId: project.organizationId,
      slug: project.slug,
      name: project.name,
      description: project.description,
      status: project.status,
      visibility: project.visibility,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      createdByUserId: project.createdByUserId,
      updatedByUserId: project.updatedByUserId,
      createdByName: user.name,
      createdByEmail: user.email,
    })
    .from(project)
    .innerJoin(user, eq(project.createdByUserId, user.id))
    .where(eq(project.organizationId, organizationId))
    .orderBy(desc(project.updatedAt), desc(project.createdAt));
}

export async function getProjectForOrganization(
  organizationId: string,
  projectId: string,
) {
  const [record] = await db
    .select()
    .from(project)
    .where(
      and(eq(project.organizationId, organizationId), eq(project.id, projectId)),
    )
    .limit(1);

  return record ?? null;
}
