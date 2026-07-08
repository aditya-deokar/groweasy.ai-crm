import { clientEnv } from "@/lib/env";

type ApiParser<T> = (value: unknown) => T;

interface ApiEnvelope {
  success: boolean;
  message: string;
  data?: unknown;
  error?: {
    code?: string;
    details?: unknown;
  };
  meta?: {
    requestId?: string;
  };
}

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: unknown;
  public readonly requestId: string | null;

  public constructor(
    message: string,
    options: {
      code?: string;
      statusCode?: number;
      details?: unknown;
      requestId?: string | null;
    } = {}
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = options.code ?? "API_REQUEST_FAILED";
    this.statusCode = options.statusCode ?? 500;
    this.details = options.details;
    this.requestId = options.requestId ?? null;
  }
}

interface ApiRequestOptions<T> extends Omit<RequestInit, "body"> {
  body?: BodyInit | null;
  parse: ApiParser<T>;
}

export async function apiRequest<T>(
  path: string,
  { parse, headers, body, ...init }: ApiRequestOptions<T>
): Promise<T> {
  const response = await fetch(`${clientEnv.apiBaseUrl}${path}`, {
    ...init,
    headers: withDefaultHeaders(headers, body),
    body,
  });

  const payload = await parseEnvelope(response);

  if (!response.ok || !payload.success) {
    throw new ApiClientError(payload.message, {
      code: payload.error?.code,
      statusCode: response.status,
      details: payload.error?.details,
      requestId: payload.meta?.requestId ?? null,
    });
  }

  try {
    return parse(payload.data);
  } catch (error) {
    throw new ApiClientError("Received an unexpected response from the server.", {
      code: "INVALID_API_RESPONSE",
      statusCode: response.status,
      details: error instanceof Error ? error.message : error,
      requestId: payload.meta?.requestId ?? null,
    });
  }
}

function withDefaultHeaders(headers: HeadersInit | undefined, body: BodyInit | null | undefined) {
  const resolvedHeaders = new Headers(headers);

  if (body && !(body instanceof FormData) && !resolvedHeaders.has("Content-Type")) {
    resolvedHeaders.set("Content-Type", "application/json");
  }

  return resolvedHeaders;
}

async function parseEnvelope(response: Response): Promise<ApiEnvelope> {
  let rawPayload: unknown;

  try {
    rawPayload = await response.json();
  } catch {
    throw new ApiClientError("The server returned an unreadable response.", {
      code: "INVALID_API_RESPONSE",
      statusCode: response.status,
    });
  }

  if (!isRecord(rawPayload)) {
    throw new ApiClientError("The server returned an invalid response envelope.", {
      code: "INVALID_API_ENVELOPE",
      statusCode: response.status,
    });
  }

  if (typeof rawPayload.success !== "boolean" || typeof rawPayload.message !== "string") {
    throw new ApiClientError("The server returned an invalid response envelope.", {
      code: "INVALID_API_ENVELOPE",
      statusCode: response.status,
      details: rawPayload,
    });
  }

  return {
    success: rawPayload.success,
    message: rawPayload.message,
    data: rawPayload.data,
    error: isRecord(rawPayload.error)
      ? {
          code: typeof rawPayload.error.code === "string" ? rawPayload.error.code : undefined,
          details: rawPayload.error.details,
        }
      : undefined,
    meta: isRecord(rawPayload.meta)
      ? {
          requestId:
            typeof rawPayload.meta.requestId === "string" ? rawPayload.meta.requestId : undefined,
        }
      : undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
