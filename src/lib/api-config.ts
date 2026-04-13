export function getHetznerApi(): string {
  const url = process.env.HETZNER_API_URL;
  if (!url) {
    throw new Error(
      "HETZNER_API_URL is not configured. Set this environment variable to a valid API base URL.",
    );
  }
  return url;
}

/** Base URL for forge-web3 `signal_api_server` (e.g. http://host:8402). Used only server-side. */
export function getSignalApiBase(): string | null {
  const raw = process.env.SIGNAL_API_URL?.trim();
  if (!raw) {
    return null;
  }
  return raw.replace(/\/$/, "");
}
