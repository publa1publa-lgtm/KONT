"use client";

import { useMemo } from "react";
import { SelectMenu } from "./SelectMenu";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function parseTime(value: string): { hh: number; mm: number } | null {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hh, mm] = value.split(":").map((x) => Number(x));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23) return null;
  if (mm < 0 || mm > 59) return null;
  return { hh, mm };
}

export function TimePicker({
  label,
  value,
  onChange,
  stepMinutes = 15,
  widthClassName = "min-w-[250px]",
  variant = "default",
}: {
  label: string;
  value: string; // HH:mm
  onChange: (time: string) => void;
  stepMinutes?: number;
  widthClassName?: string;
  variant?: "default" | "studio";
}) {
  const parsed = parseTime(value) ?? { hh: 10, mm: 0 };
  const minuteStep = Math.max(1, Math.min(60, Math.floor(stepMinutes)));
  const minute = Math.floor(parsed.mm / minuteStep) * minuteStep;

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => ({ value: i, label: pad2(i) })), []);
  const minutes = useMemo(
    () => Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep).filter((m) => m < 60).map((m) => ({ value: m, label: pad2(m) })),
    [minuteStep],
  );

  const fullWidth = widthClassName.includes("w-full");
  const rootClass = fullWidth
    ? "grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2"
    : ["flex items-center gap-2", widthClassName].join(" ");
  const selectWidth = fullWidth ? "w-full min-w-0" : "min-w-[110px]";

  return (
    <div className={rootClass} aria-label={label}>
      <SelectMenu
        variant={variant}
        label="Hours"
        value={parsed.hh}
        options={hours}
        widthClassName={selectWidth}
        triggerClassName={variant === "studio" ? "studio-cal-select__trigger" : ""}
        onChange={(hh) => onChange(`${pad2(Number(hh))}:${pad2(minute)}`)}
      />
      <span
        className={
          variant === "studio"
            ? "text-center text-sm font-semibold text-[var(--muted)]"
            : "text-center text-sm font-semibold text-white/35"
        }
      >
        :
      </span>
      <SelectMenu
        variant={variant}
        label="Minutes"
        value={minute}
        options={minutes}
        widthClassName={selectWidth}
        triggerClassName={variant === "studio" ? "studio-cal-select__trigger" : ""}
        onChange={(mm) => onChange(`${pad2(parsed.hh)}:${pad2(Number(mm))}`)}
      />
    </div>
  );
}

