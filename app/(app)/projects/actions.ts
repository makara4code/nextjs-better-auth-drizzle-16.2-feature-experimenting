"use server";

import { randomUUID } from "node:crypto";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

import { db } from "@/db";
import { project } from "@/db/schema";
import { requireOrgPermission } from "@/lib/auth/guards";
import {
  type ProjectStatus,
  projectStatusOptions,
} from "@/lib/project-constants";
import {
  getProjectCacheTag,
  getProjectsCacheTag,
  slugifyProjectName,
} from "@/lib/projects";

async function resolveUniqueProjectSlug(
  organizationId: string,
  name: string,
  projectId?: string,
) {
  const baseSlug = slugifyProjectName(name) || "project";
  let candidate = baseSlug;
  let counter = 2;

  while (true) {
    const [existingProject] = await db
      .select({ id: project.id })
      .from(project)
      .where(
        projectId
          ? and(
              eq(project.organizationId, organizationId),
              eq(project.slug, candidate),
              ne(project.id, projectId),
            )
          : and(
              eq(project.organizationId, organizationId),
              eq(project.slug, candidate),
            ),
      )
      .limit(1);

    if (!existingProject) {
      return candidate;
    }

    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function createProjectAction(formData: FormData) {
  const { organization, session } = await requireOrgPermission({
    project: ["create"],
  });

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawStatus = String(formData.get("status") ?? "planning");
  const status = projectStatusOptions.includes(
    rawStatus as (typeof projectStatusOptions)[number],
  )
    ? rawStatus
    : "planning";

  if (!name) {
    throw new Error("Project name is required.");
  }

  const slug = await resolveUniqueProjectSlug(organization.id, name);

  const projectId = randomUUID();
  const now = new Date();

  await db.insert(project).values({
    id: projectId,
    organizationId: organization.id,
    slug,
    name,
    description: description || null,
    status,
    visibility: "organization",
    createdByUserId: session.user.id,
    updatedByUserId: session.user.id,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/projects");
  updateTag(getProjectsCacheTag(organization.id));

  return {
    createdByEmail: session.user.email,
    createdByName: session.user.name,
    description: description || null,
    id: projectId,
    name,
    slug,
    status: status as ProjectStatus,
    updatedAt: now.toISOString(),
  };
}

export async function updateProjectAction(formData: FormData) {
  const { organization, session } = await requireOrgPermission({
    project: ["update"],
  });

  const projectId = String(formData.get("projectId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawStatus = String(formData.get("status") ?? "active");
  const status = projectStatusOptions.includes(
    rawStatus as (typeof projectStatusOptions)[number],
  )
    ? rawStatus
    : "active";

  if (!projectId || !name) {
    throw new Error("Project id and name are required.");
  }

  const slug = await resolveUniqueProjectSlug(organization.id, name, projectId);

  const now = new Date();

  const [updatedProject] = await db
    .update(project)
    .set({
      name,
      slug,
      description: description || null,
      status,
      updatedByUserId: session.user.id,
      updatedAt: now,
    })
    .where(
      and(eq(project.organizationId, organization.id), eq(project.id, projectId)),
    )
    .returning({ id: project.id });

  if (!updatedProject) {
    throw new Error("Project not found in the active organization.");
  }

  revalidatePath("/projects");
  updateTag(getProjectsCacheTag(organization.id));
  updateTag(getProjectCacheTag(organization.id, projectId));

  return {
    description: description || null,
    id: projectId,
    name,
    slug,
    status: status as ProjectStatus,
    updatedAt: now.toISOString(),
  };
}

export async function deleteProjectAction(formData: FormData) {
  const { organization } = await requireOrgPermission({
    project: ["delete"],
  });

  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    throw new Error("Project id is required.");
  }

  const [deletedProject] = await db
    .delete(project)
    .where(
      and(eq(project.organizationId, organization.id), eq(project.id, projectId)),
    )
    .returning({ id: project.id });

  if (!deletedProject) {
    throw new Error("Project not found in the active organization.");
  }

  revalidatePath("/projects");
  updateTag(getProjectsCacheTag(organization.id));
  updateTag(getProjectCacheTag(organization.id, projectId));

  return {
    id: deletedProject.id,
  };
}
