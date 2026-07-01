import Image from "next/image";

import { cn } from "@/lib/utils";

type KontBrandLogoProps = {
  variant?: "full" | "mark";
  className?: string;
  priority?: boolean;
  decorative?: boolean;
};

export function KontBrandLogo({
  variant = "full",
  className,
  priority = false,
  decorative = false,
}: KontBrandLogoProps) {
  const alt = decorative ? "" : "KONT";

  if (variant === "mark") {
    return (
      <Image
        src="/brand/kont-logo.svg"
        alt={alt}
        width={189}
        height={189}
        className={cn(className)}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src="/brand/kont-logo-full.svg"
      alt={alt}
      width={905}
      height={205}
      className={cn(className)}
      priority={priority}
    />
  );
}
