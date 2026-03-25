import {
  adminClient,
  emailOTPClient,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import {
  organizationAc,
  organizationRoles,
} from "./auth/permissions";

export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),
    organizationClient({
      ac: organizationAc,
      roles: organizationRoles,
      dynamicAccessControl: {
        enabled: true,
      },
    }),
    adminClient(),
  ],
});
