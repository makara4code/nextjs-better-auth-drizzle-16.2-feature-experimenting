import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";

import { db } from "../db";
import * as schema from "../db/schema";
import {
  BETTER_AUTH_SESSION_DATA_COOKIE,
  BETTER_AUTH_SESSION_TOKEN_COOKIE,
} from "./auth-cookies";
import { sendEmail } from "./email";
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
      }
    : {}),
  rateLimit: {
    enabled: true,
    ...(redisSecondaryStorage
      ? {
          storage: "secondary-storage" as const,
        }
      : {}),
  },
  emailVerification: {
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      rateLimit: {
        window: 60,
        max: 3,
      },
      sendVerificationOTP: async ({ email, otp, type }) => {
        const actionLabel =
          type === "sign-in"
            ? "complete your sign-in"
            : type === "forget-password"
              ? "reset your password"
              : type === "change-email"
                ? "confirm your email change"
                : "verify your email";

        void sendEmail({
          to: email,
          subject: "Your verification code",
          text: `Use this verification code to ${actionLabel}: ${otp}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
              <h1 style="font-size: 20px; margin-bottom: 16px;">Verification code</h1>
              <p style="margin-bottom: 16px;">
                Use this code to ${actionLabel}.
              </p>
              <p style="margin-bottom: 24px; font-size: 32px; font-weight: 700; letter-spacing: 0.4em;">
                ${otp}
              </p>
              <p style="font-size: 14px; color: #4b5563;">
                This code expires soon. If you did not request it, you can ignore this email.
              </p>
            </div>
          `,
        });
      },
    }),
  ],
});
