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

export async function apiMutate<T>(path: string, init?: ApiFetchOptions): Promise<T> {
  return apiFetch<T>(path, init);
}
