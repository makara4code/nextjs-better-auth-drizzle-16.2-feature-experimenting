import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "../db";
import * as schema from "../db/schema";
import {
  BETTER_AUTH_SESSION_DATA_COOKIE,
  BETTER_AUTH_SESSION_TOKEN_COOKIE,
} from "./auth-cookies";
import { getRedisClient } from "./redis";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const redisUrl = process.env.REDIS_URL?.trim();

const redisSecondaryStorage = redisUrl
  ? {
      get: async (key: string) => {
        const client = await getRedisClient();
        return client ? client.get(key) : null;
      },
      set: async (key: string, value: string, ttl?: number) => {
        const client = await getRedisClient();

        if (!client) {
          return;
        }

        if (typeof ttl === "number" && ttl > 0) {
          await client.set(key, value, {
            EX: ttl,
          });
          return;
        }

        await client.set(key, value);
      },
      delete: async (key: string) => {
        const client = await getRedisClient();

        if (!client) {
          return;
        }

        await client.del(key);
      },
    }
  : undefined;

export const auth = betterAuth({
  appName: "Next 16 Starter",
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [baseURL],
  cookies: {
    sessionToken: {
      name: BETTER_AUTH_SESSION_TOKEN_COOKIE,
    },
    sessionData: {
      name: BETTER_AUTH_SESSION_DATA_COOKIE,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  ...(redisSecondaryStorage
    ? {
        secondaryStorage: redisSecondaryStorage,
        rateLimit: {
          storage: "secondary-storage" as const,
        },
      }
    : {}),
  emailAndPassword: {
    enabled: true,
  },
});
