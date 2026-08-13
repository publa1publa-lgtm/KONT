"use client";

import { useEffect, useRef, useState } from "react";

type CountUpOptions = {
  duration?: number;
  decimals?: number;
};

/**
 * Counts from 0 up to `target` once the element scrolls into view.
 * SSR-safe: the initial render shows the final value (so no-JS and the
 * server markup match), then the animation replays it on the client.
 * Honours `prefers-reduced-motion`.
 */
export function useCountUp<T extends HTMLElement>(
  target: number,
  { duration = 1500, decimals = 0 }: CountUpOptions = {},
) {
  const safeTarget = Number.isFinite(target) ? target : 0;
  const ref = useRef<T>(null);
  const [value, setValue] = useState(safeTarget);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(safeTarget);
      return;
    }

    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        setValue(0);
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(safeTarget * eased);
          if (progress < 1) {
            raf = requestAnimationFrame(tick);
          } else {
            setValue(safeTarget);
          }
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [safeTarget, duration]);

  const display = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return { ref, display };
}
