import { invalidateResourceCache } from "@/lib/client/resourceCache";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiFetchOptions = RequestInit & {
  /** Parse JSON body; default true for GET/POST/PUT/PATCH unless body is FormData */
  json?: boolean;
};

const DEFAULT_INIT: RequestInit = {
  credentials: "include",
  cache: "no-store",
};

export async function apiFetch<T>(path: string, init?: ApiFetchOptions): Promise<T> {
  const { json: parseJson = true, ...rest } = init ?? {};
  const res = await fetch(path, { ...DEFAULT_INIT, ...rest });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    const message =
      body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : res.statusText || "Request failed";
    throw new ApiError(message, res.status, body);
  }

  if (!parseJson || res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

/** @deprecated Use `apiFetch` — kept for treeApi compatibility */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    return await apiFetch<T>(url, init);
  } catch {
    return null;
  }
}

export async function apiGet<T>(path: string, cacheKey?: string, ttlMs?: number): Promise<T> {
  if (cacheKey && ttlMs) {
    const { getCachedResource } = await import("@/lib/client/resourceCache");
    return getCachedResource(cacheKey, ttlMs, () => apiFetch<T>(path));
  }
  return apiFetch<T>(path);
}

export async function apiMutate<T>(
  path: string,
  init?: ApiFetchOptions & { invalidateKeys?: string[] },
): Promise<T> {
  const { invalidateKeys, ...rest } = init ?? {};
  const result = await apiFetch<T>(path, rest);
  if (invalidateKeys?.length) {
    for (const key of invalidateKeys) invalidateResourceCache(key);
  }
  return result;
}
