import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  BETTER_AUTH_SESSION_DATA_COOKIE,
  BETTER_AUTH_SESSION_TOKEN_COOKIE,
} from "@/lib/auth-cookies";

function hasBetterAuthSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name }) => {
    return (
      name === BETTER_AUTH_SESSION_TOKEN_COOKIE ||
      name === BETTER_AUTH_SESSION_DATA_COOKIE ||
      name.endsWith("session_token") ||
      name.endsWith("session_data")
    );
  });
}

export function proxy(request: NextRequest) {
  if (hasBetterAuthSessionCookie(request)) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("from", request.nextUrl.pathname);

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/settings/:path*", "/organizations/:path*"],
};
