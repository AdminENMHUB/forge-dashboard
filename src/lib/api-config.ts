if (!process.env.HETZNER_API_URL) {
  throw new Error(
    "HETZNER_API_URL is not configured. Set this environment variable to a valid API base URL.",
  );
}

export const HETZNER_API: string = process.env.HETZNER_API_URL;
