import { createClient } from "redis";

type AppRedisClient = ReturnType<typeof createClient>;

declare global {
  var __redisClientPromise:
    | Promise<AppRedisClient | null>
    | undefined;
}

function getRedisUrl() {
  return process.env.REDIS_URL?.trim();
}

async function connectRedisClient() {
  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    return null;
  }

  const client = createClient({
    url: redisUrl,
  });

  client.on("error", (error) => {
    console.error("[redis] client error", error);
  });

  await client.connect();
  return client;
}

export async function getRedisClient() {
  globalThis.__redisClientPromise ??= connectRedisClient().catch((error) => {
    console.error("[redis] failed to connect", error);
    globalThis.__redisClientPromise = undefined;
    return null;
  });

  const client = await globalThis.__redisClientPromise;

  if (!client?.isOpen) {
    globalThis.__redisClientPromise = undefined;
    return null;
  }

  return client;
}

export async function getRedisJson<T>(key: string) {
  const client = await getRedisClient();

  if (!client) {
    return null;
  }

  try {
    const value = await client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch (error) {
    console.error("[redis] failed to read key", { key, error });
    return null;
  }
}

export async function setRedisJson(
  key: string,
  value: unknown,
  expirationInSeconds: number,
) {
  const client = await getRedisClient();

  if (!client) {
    return;
  }

  try {
    await client.set(key, JSON.stringify(value), {
      EX: expirationInSeconds,
    });
  } catch (error) {
    console.error("[redis] failed to write key", { key, error });
  }
}

export async function deleteRedisKey(key: string) {
  const client = await getRedisClient();

  if (!client) {
    return;
  }

  try {
    await client.del(key);
  } catch (error) {
    console.error("[redis] failed to delete key", { key, error });
  }
}
