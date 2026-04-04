export function getHetznerApi(): string {
  const url = process.env.HETZNER_API_URL;
  if (!url) {
    throw new Error(
      "HETZNER_API_URL is not configured. " +
        "Set this in .env.local (local dev) or Vercel Environment Variables (production). " +
        "Example: HETZNER_API_URL=http://89.167.82.184:8080",
    );
  }
  return url.replace(/\/+$/, ""); // strip trailing slash to prevent double-slash in URLs
}
