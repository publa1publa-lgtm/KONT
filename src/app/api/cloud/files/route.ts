import { NextResponse } from "next/server";

import { json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import { CloudProviderError, isCloudProviderId, type CloudFileKind } from "@/lib/cloud/types";
import { listCloudFiles } from "@/lib/cloud/providers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseKind(raw: string | null): CloudFileKind {
  return raw === "image" ? "image" : "video";
}

export async function GET(req: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const url = new URL(req.url);
  const providerRaw = url.searchParams.get("provider") ?? "googleDrive";
  if (!isCloudProviderId(providerRaw)) {
    return json({ error: "Unknown cloud provider." }, 400);
  }

  try {
    const listed = await listCloudFiles(userId, providerRaw, {
      kind: parseKind(url.searchParams.get("kind")),
      query: url.searchParams.get("q") ?? undefined,
      pageToken: url.searchParams.get("pageToken") ?? undefined,
    });
    return json({ provider: providerRaw, ...listed });
  } catch (err) {
    if (err instanceof CloudProviderError) {
      return json({ error: err.message, code: err.code }, err.status);
    }
    console.error("[cloud.files]", err);
    return json({ error: "Could not list cloud files." }, 500);
  }
}
