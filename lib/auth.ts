import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "../db";
import {
  BETTER_AUTH_SESSION_DATA_COOKIE,
  BETTER_AUTH_SESSION_TOKEN_COOKIE,
} from "./auth-cookies";
import * as schema from "../db/schema";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

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
  emailAndPassword: {
    enabled: true,
  },
});
