import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, emailOTP, organization } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "../db";
import * as schema from "../db/schema";
import {
  BETTER_AUTH_SESSION_DATA_COOKIE,
  BETTER_AUTH_SESSION_TOKEN_COOKIE,
} from "./auth-cookies";
import {
  renderOrganizationInvitationEmail,
  renderOtpEmail,
  sendEmail,
} from "./email";
import {
  internalPlatformDefaultRole,
  organizationAc,
  organizationRoles,
  platformRoles,
} from "./auth/permissions";
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
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          if (createdUser.role !== internalPlatformDefaultRole) {
            return;
          }

          await db
            .update(schema.user)
            .set({
              role: null,
            })
            .where(eq(schema.user.id, createdUser.id));
        },
      },
    },
  },
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
    organization({
      ac: organizationAc,
      allowUserToCreateOrganization: true,
      creatorRole: "org_superadmin",
      membershipLimit: 250,
      invitationLimit: 250,
      invitationExpiresIn: 60 * 60 * 24 * 2,
      cancelPendingInvitationsOnReInvite: true,
      requireEmailVerificationOnInvitation: true,
      roles: organizationRoles,
      dynamicAccessControl: {
        enabled: true,
        maximumRolesPerOrganization: 25,
      },
      sendInvitationEmail: async (data) => {
        const inviteLink = `${baseURL}/accept-invitation?invitationId=${encodeURIComponent(data.id)}`;
        const emailContent = renderOrganizationInvitationEmail({
          appName: "Next 16 Starter",
          organizationName: data.organization.name,
          inviterName: data.inviter.user.name,
          role: data.role,
          inviteLink,
        });

        await sendEmail({
          to: data.email,
          subject: `Invitation to join ${data.organization.name}`,
          text: emailContent.text,
          html: emailContent.html,
        });
      },
    }),
    admin({
      defaultRole: internalPlatformDefaultRole,
      adminRoles: ["global_admin", "global_superadmin"],
      roles: platformRoles,
    }),
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
        const emailContent = renderOtpEmail({
          appName: "Next 16 Starter",
          actionLabel,
          otp,
        });

        void sendEmail({
          to: email,
          subject: "Your verification code",
          text: emailContent.text,
          html: emailContent.html,
        });
      },
    }),
  ],
});
