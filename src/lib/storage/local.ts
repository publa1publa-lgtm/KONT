import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import type { StorageAdapter, StorageProvider, StoredObject } from "./types";

function rootDir(): string {
  const override = process.env.MEDIA_LOCAL_DIR?.trim();
  if (override) return path.resolve(override);
  return path.join(process.cwd(), "data", "uploads");
}

/** Reject keys that try to escape the root via `..` or absolute components. */
function safeJoin(base: string, key: string): string {
  if (!key || key.includes("\0")) throw new Error("Invalid storage key");
  const normalized = path.posix.normalize(key.replace(/\\/g, "/"));
  if (normalized.startsWith("..") || path.posix.isAbsolute(normalized)) {
    throw new Error("Invalid storage key");
  }
  const resolved = path.resolve(base, normalized);
  const baseAbs = path.resolve(base);
  if (resolved !== baseAbs && !resolved.startsWith(baseAbs + path.sep)) {
    throw new Error("Invalid storage key");
  }
  return resolved;
}

export class LocalDiskStorage implements StorageAdapter {
  readonly provider: StorageProvider = "local";

  async put(key: string, data: Buffer | Uint8Array, _mime: string): Promise<StoredObject> {
    const dest = safeJoin(rootDir(), key);
    await mkdir(path.dirname(dest), { recursive: true });
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    await writeFile(dest, buf);
    return {
      provider: this.provider,
      key,
      url: this.publicUrl(key),
      sizeBytes: buf.length,
    };
  }

  publicUrl(key: string): string {
    const safe = key
      .split("/")
      .filter((seg) => seg.length > 0)
      .map((seg) => encodeURIComponent(seg))
      .join("/");
    return `/api/media/${safe}`;
  }

  async read(key: string): Promise<Buffer> {
    return readFile(safeJoin(rootDir(), key));
  }

  async readStream(key: string): Promise<{ stream: ReadableStream<Uint8Array>; sizeBytes: number }> {
    const abs = safeJoin(rootDir(), key);
    const st = await stat(abs);
    const node = createReadStream(abs);
    const stream = Readable.toWeb(node) as ReadableStream<Uint8Array>;
    return { stream, sizeBytes: st.size };
  }

  async exists(key: string): Promise<boolean> {
    return stat(safeJoin(rootDir(), key))
      .then(() => true)
      .catch(() => false);
  }

  async delete(key: string): Promise<void> {
    await unlink(safeJoin(rootDir(), key)).catch(() => {});
  }
}
