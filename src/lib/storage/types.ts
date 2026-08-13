export type StorageProvider = "local" | "s3" | "r2" | "cloudinary";

export type StoredObject = {
  provider: StorageProvider;
  key: string;
  url: string;
  sizeBytes: number;
};

/**
 * Pluggable storage backend for user-uploaded media.
 *
 * Production targets (S3 / R2 / Cloudinary) implement the same interface;
 * the rest of the app should never touch a provider-specific SDK directly.
 */
export interface StorageAdapter {
  readonly provider: StorageProvider;

  /** Persist `data` under `key` (relative storage key, e.g. `users/<uid>/<uuid>.mp4`). */
  put(key: string, data: Buffer | Uint8Array, mimeType: string): Promise<StoredObject>;

  /** Public/accessor URL for a stored object (signed URL or proxy route). */
  publicUrl(key: string): string;

  /** Read the full object back into memory. Prefer streaming for large files in routes. */
  read(key: string): Promise<Buffer>;

  /** Streaming read for serving via Response — returns Web ReadableStream + size if known. */
  readStream(key: string): Promise<{ stream: ReadableStream<Uint8Array>; sizeBytes: number }>;

  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}
