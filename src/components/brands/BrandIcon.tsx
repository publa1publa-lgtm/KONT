type BrandIconProps = {
  src: string;
  size: number;
  alt?: string;
  className?: string;
};

const TIKTOK_NOTE =
  "M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z";

/** Official TikTok app mark: black tile + white note. */
export function TikTokMark({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect width="24" height="24" rx="5.5" fill="#000" />
      <path fill="#fff" transform="translate(4 3.95)" d={TIKTOK_NOTE} />
    </svg>
  );
}

export function BrandIcon({ src, size, alt = "", className }: BrandIconProps) {
  if (src.includes("tiktok")) {
    return <TikTokMark size={size} className={className} />;
  }

  return (
    // Native img keeps SVG vector; next/image rasterizes it and distorts the mark.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={size} height={size} className={className} draggable={false} />
  );
}
