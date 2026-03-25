export function getSafeInternalPath(
  value: string | null | undefined,
  fallback = "/",
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function createRedirectingRoute(destination: string) {
  const params = new URLSearchParams({
    to: getSafeInternalPath(destination, "/"),
  });

  return `/redirecting?${params.toString()}`;
}
