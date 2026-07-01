/** Browser-side metadata probing for selected media files (no server work involved). */

export type ImageProbe = { width: number; height: number };
export type VideoProbe = { width: number; height: number; durationMs: number };

export async function probeImage(file: File): Promise<ImageProbe | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode().catch(() => {
      // Older browsers / weird formats: fall back to onload.
      return new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image probe failed"));
      });
    });
    if (!img.naturalWidth || !img.naturalHeight) return null;
    return { width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function probeVideo(file: File): Promise<VideoProbe | null> {
  const url = URL.createObjectURL(file);
  try {
    const probe = await new Promise<VideoProbe | null>((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.src = url;
      const cleanup = () => {
        video.onloadedmetadata = null;
        video.onerror = null;
      };
      video.onloadedmetadata = () => {
        const w = video.videoWidth || 0;
        const h = video.videoHeight || 0;
        const durationMs = Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : 0;
        cleanup();
        if (!w || !h) {
          resolve(null);
          return;
        }
        resolve({ width: w, height: h, durationMs });
      };
      video.onerror = () => {
        cleanup();
        resolve(null);
      };
    });
    return probe;
  } finally {
    URL.revokeObjectURL(url);
  }
}
