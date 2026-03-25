import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { project, user } from "@/db/schema";
import { projectStatusOptions } from "@/lib/project-constants";
import { getRedisJson, setRedisJson } from "@/lib/redis";

const PROJECTS_CACHE_PREFIX = "projects";
const PROJECTS_CACHE_PROBE_PREFIX = "projects:probe";
const PROJECTS_CACHE_PROBE_TTL_SECONDS = 60 * 60;

type CacheProbeState = {
  token: string;
  at: string;
};

declare global {
  var __projectsCacheProbeStore: Map<string, CacheProbeState> | undefined;
}

export function getProjectsCacheTag(organizationId: string) {
  return `${PROJECTS_CACHE_PREFIX}:${organizationId}`;
}

export function getProjectCacheTag(
  organizationId: string,
  projectId: string,
) {
  return `${PROJECTS_CACHE_PREFIX}:${organizationId}:${projectId}`;
}

function getProjectsCacheProbeKey(organizationId: string) {
  return `${PROJECTS_CACHE_PROBE_PREFIX}:${organizationId}`;
}

function getProjectsCacheProbeStore() {
  globalThis.__projectsCacheProbeStore ??= new Map<string, CacheProbeState>();

  return globalThis.__projectsCacheProbeStore;
}

async function readProjectsCacheProbe(key: string) {
  const redisValue = await getRedisJson<CacheProbeState>(key);

  if (redisValue) {
    return redisValue;
  }

  return getProjectsCacheProbeStore().get(key) ?? null;
}

async function writeProjectsCacheProbe(key: string, value: CacheProbeState) {
  getProjectsCacheProbeStore().set(key, value);
  await setRedisJson(key, value, PROJECTS_CACHE_PROBE_TTL_SECONDS);
}

export function slugifyProjectName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function getProjectsForOrganizationCached(organizationId: string) {
  "use cache";

  cacheLife("minutes");
  cacheTag(getProjectsCacheTag(organizationId));

  const probeState = {
    token: randomUUID(),
    at: new Date().toISOString(),
  } satisfies CacheProbeState;

  await writeProjectsCacheProbe(
    getProjectsCacheProbeKey(organizationId),
    probeState,
  );

  console.log("[projects-data] getProjectsForOrganization executed", {
    at: probeState.at,
    env: process.env.NODE_ENV,
    organizationId,
    probeToken: probeState.token,
  });

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

export async function getProjectsForOrganization(organizationId: string) {
  const probeKey = getProjectsCacheProbeKey(organizationId);
  const before = await readProjectsCacheProbe(probeKey);
  const data = await getProjectsForOrganizationCached(organizationId);
  const after = await readProjectsCacheProbe(probeKey);

  const cacheStatus =
    before && after && before.token === after.token ? "hit" : "miss";

  console.log("[projects-cache] getProjectsForOrganization", {
    at: new Date().toISOString(),
    cacheStatus,
    env: process.env.NODE_ENV,
    organizationId,
    probeToken: after?.token ?? null,
  });

  return {
    cacheStatus,
    data,
  } as const;
}

export async function getProjectForOrganization(
  organizationId: string,
  projectId: string,
) {
  "use cache";

  cacheLife("minutes");
  cacheTag(getProjectsCacheTag(organizationId));
  cacheTag(getProjectCacheTag(organizationId, projectId));

  const [record] = await db
    .select()
    .from(project)
    .where(
      and(eq(project.organizationId, organizationId), eq(project.id, projectId)),
    )
    .limit(1);

  return record ?? null;
}
