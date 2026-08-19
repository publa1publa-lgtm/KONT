import path from "node:path";

import { getStorage } from "@/lib/storage";
import { mimeForExtension } from "@/lib/media/limits";
import type { NextResponse } from "next/server";

import { badRequest, notFound, unauthorized } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import * as mediaRepo from "@/lib/repos/mediaRepo";

export async function getMediaByStoragePath(params: Promise<{ path: string[] }>): Promise<Response> {
  const userId = await requireUser();
  if (typeof userId !== "string") return userId as NextResponse;

  const { path: segments } = await params;
  if (!segments || segments.length === 0) {
    return notFound();
  }

  const storageKey = segments.join("/");
  if (storageKey.includes("..") || storageKey.startsWith("/") || storageKey.includes("\0") || !/^[\w\-./]+$/.test(storageKey)) {
    return badRequest("Invalid path");
  }

  const asset = await mediaRepo.findMediaAssetForProxy(storageKey);
  if (!asset || asset.deletedAt || asset.status === "DELETED") {
    return notFound();
  }

  if (asset.userId !== userId) {
    return unauthorized();
  }

  const storage = getStorage();
  let stream: ReadableStream<Uint8Array>;
  let sizeBytes: number;
  try {
    const r = await storage.readStream(storageKey);
    stream = r.stream;
    sizeBytes = r.sizeBytes;
  } catch {
    return notFound();
  }

  const ext = path.posix.extname(storageKey).slice(1);
  const contentType = asset.mimeType || mimeForExtension(ext);

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(sizeBytes),
      "Cache-Control": "private, max-age=300, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
