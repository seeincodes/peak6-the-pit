export function extractOrgSlugFromHostname(hostname: string): string | null {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
    return null;
  }
  const parts = host.split(".");
  if (parts.length < 3) return null;
  return parts[0];
}
