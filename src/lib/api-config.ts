export function getHetznerApi(): string {
  const url = process.env.HETZNER_API_URL;
  if (!url) {
    throw new Error(
      "HETZNER_API_URL is not configured. Set this environment variable to a valid API base URL.",
    );
  }
  return url;
}
