const DEFAULT_API_BASE_URL = "http://localhost:5000/api/v1";

export const clientEnv = {
  apiBaseUrl: normalizeApiBaseUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL
  ),
};

function normalizeApiBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.toString().replace(/\/+$/, "");
  } catch {
    return DEFAULT_API_BASE_URL;
  }
}
