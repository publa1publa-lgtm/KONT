import "server-only";

import { MetaError, type MetaTokenResponse } from "./types";

function graphVersion(): string {
  return process.env.META_GRAPH_VERSION?.trim() || "v21.0";
}

export function graphBase(): string {
  return `https://graph.facebook.com/${graphVersion()}`;
}

export function facebookDialogBase(): string {
  return `https://www.facebook.com/${graphVersion()}`;
}

export async function readGraphJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new MetaError("Empty response from Meta Graph API.", { code: "META_EMPTY_RESPONSE", status: res.status || 502 });
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new MetaError("Invalid JSON response from Meta Graph API.", {
      code: "META_INVALID_JSON",
      status: res.status || 502,
      details: text.slice(0, 500),
    });
  }
}

async function parseGraph<T>(res: Response, fallback: string): Promise<T> {
  const body = await readGraphJson<unknown>(res);
  const err = body && typeof body === "object" ? (body as MetaTokenResponse).error : undefined;
  if (err || res.status >= 400) {
    throw new MetaError(err?.message || fallback, {
      code: err?.code != null ? `META_${err.code}` : "META_GRAPH",
      status: res.status >= 400 ? res.status : 502,
      details: body,
    });
  }
  return body as T;
}

export async function graphGet<T>(path: string, accessToken: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${graphBase()}${path.startsWith("/") ? path : `/${path}`}`);
  url.searchParams.set("access_token", accessToken);
  if (params) {
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  }
  return parseGraph<T>(await fetch(url, { cache: "no-store" }), "Meta Graph request failed.");
}

export async function graphPost<T>(
  path: string,
  accessToken: string,
  fields: Record<string, string | undefined>,
): Promise<T> {
  const body = new URLSearchParams();
  body.set("access_token", accessToken);
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) body.set(key, value);
  }
  const res = await fetch(`${graphBase()}${path.startsWith("/") ? path : `/${path}`}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  return parseGraph<T>(res, "Meta Graph request failed.");
}

export async function graphPostMultipart<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${graphBase()}${path.startsWith("/") ? path : `/${path}`}`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });
  return parseGraph<T>(res, "Meta Graph upload failed.");
}
