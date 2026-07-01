"use client";

export function VideoPreview({
  videoUrl,
  className,
  emptyClassName,
  fill = false,
  muted = false,
  controls = true,
  autoPlay = false,
  loop = false,
}: {
  videoUrl: string | null;
  className?: string;
  emptyClassName?: string;
  /** Fill a positioned parent (e.g. 9:16 reel frame). */
  fill?: boolean;
  muted?: boolean;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
}) {
  if (!videoUrl) {
    return (
      <div
        className={[
          fill
            ? "absolute inset-0 flex items-center justify-center"
            : "flex h-[140px] w-full items-center justify-center rounded-xl border border-white/10 bg-black/30",
          "text-xs text-[var(--muted)]",
          emptyClassName ?? "",
          className ?? "",
        ].join(" ")}
      >
        No video selected
      </div>
    );
  }

  if (fill) {
    return (
      <video
        src={videoUrl}
        controls={controls}
        muted={muted}
        autoPlay={autoPlay}
        loop={loop}
        playsInline
        className={["absolute inset-0 h-full w-full object-cover", className ?? ""].join(" ")}
      />
    );
  }

  return (
    <div className={["w-full overflow-hidden rounded-xl border border-white/10 bg-black/30", className ?? ""].join(" ")}>
      <video
        src={videoUrl}
        controls={controls}
        muted={muted}
        playsInline
        className="h-[140px] w-full object-cover"
      />
    </div>
  );
}
