"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { addMonths, buildMonthGrid, dateKeyLocal, isSameDay, isSameMonth } from "@/components/calendar/dateUtils";
import { useI18n } from "@/contexts/i18n-context";
import { intlLocale } from "@/i18n/config";

function weekDaysMondayFirst(locale: string): string[] {
  // 2021-11-01 is a Monday.
  const base = new Date("2021-11-01T00:00:00");
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const raw = fmt.format(d);
    const s = raw.length > 0 ? raw[0]!.toUpperCase() + raw.slice(1) : raw;
    days.push(s);
  }
  return days;
}

function useOnClickOutside(refs: Array<React.RefObject<HTMLElement | null>>, onOutside: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      for (const r of refs) {
        const el = r.current;
        if (el && el.contains(t)) return;
      }
      onOutside();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("touchstart", onDown);
    };
  }, [enabled, onOutside, refs]);
}

function parseDateKey(dateKey: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const d = new Date(dateKey + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

export function DatePicker({
  label,
  value,
  onChange,
  minDateKey,
  widthClassName = "min-w-[190px]",
  variant = "default",
}: {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (dateKey: string) => void;
  minDateKey?: string; // YYYY-MM-DD (inclusive)
  widthClassName?: string;
  variant?: "default" | "studio";
}) {
  const { locale, messages } = useI18n();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const gridId = useId();

  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseDateKey(value) ?? new Date(), [value]);
  const minDate = useMemo(() => (minDateKey ? parseDateKey(minDateKey) : null), [minDateKey]);

  const [month, setMonth] = useState<Date>(() => new Date(selected.getFullYear(), selected.getMonth(), 1));

  useOnClickOutside([buttonRef, panelRef], () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const grid = useMemo(() => buildMonthGrid(month), [month]);
  const weekDays = useMemo(() => weekDaysMondayFirst(intlLocale(locale)), [locale]);

  const selectedLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(intlLocale(locale), { day: "2-digit", month: "short", year: "numeric" });
    return fmt.format(selected);
  }, [locale, selected]);

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat(intlLocale(locale), { month: "long", year: "numeric" }).format(month);
  }, [locale, month]);

  const isStudio = variant === "studio";

  return (
    <div className={["relative", widthClassName].join(" ")}>
      <span className="sr-only">{label}</span>
      <button
        ref={buttonRef}
        type="button"
        onClick={() =>
          setOpen((v) => {
            const next = !v;
            if (next) setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
            return next;
          })
        }
        className={[
          "group flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs font-semibold transition focus:outline-none",
          isStudio
            ? "studio-cal-select__trigger min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
            : [
                "border-white/10 bg-white/5 text-[var(--fg)]",
                "shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]",
                "hover:bg-white/10 focus:ring-2 focus:ring-[var(--ice)]/40",
              ].join(" "),
        ].join(" ")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={gridId}
      >
        <span className="truncate">{selectedLabel}</span>
        <span
          className={[
            "transition",
            isStudio ? "studio-cal-select__caret" : "text-white/55 group-hover:text-white/75",
            open ? "rotate-180" : "",
          ].join(" ")}
        >
          ▾
        </span>
      </button>

      <div
        ref={panelRef}
        className={[
          "absolute left-0 z-40 mt-2 origin-top",
          "transition duration-200 ease-out",
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-[0.98] opacity-0",
        ].join(" ")}
      >
        <div
          className={
            isStudio
              ? "studio-composer-datepicker w-[304px] overflow-hidden rounded-xl border shadow-[0_16px_40px_-20px_rgba(15,23,42,0.18)]"
              : "w-[304px] overflow-hidden rounded-2xl border border-white/10 bg-[rgba(12,12,14,0.92)] shadow-[0_30px_90px_-50px_rgba(0,0,0,0.92)] backdrop-blur-xl"
          }
        >
          <div
            className={
              isStudio
                ? "flex items-center justify-between gap-2 border-b border-[var(--line)]/60 bg-white/50 p-3"
                : "flex items-center justify-between gap-2 border-b border-white/10 p-3"
            }
          >
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, -1))}
              className={
                isStudio
                  ? "studio-cal-btn studio-cal-btn--icon !h-9 !w-9"
                  : "rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-semibold text-[var(--fg)] transition hover:bg-white/10"
              }
              aria-label={messages.calendar.prevMonth}
            >
              ←
            </button>
            <div className="text-xs font-semibold capitalize text-[var(--fg)]">{monthLabel}</div>
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className={
                isStudio
                  ? "studio-cal-btn studio-cal-btn--icon !h-9 !w-9"
                  : "rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-semibold text-[var(--fg)] transition hover:bg-white/10"
              }
              aria-label={messages.calendar.nextMonth}
            >
              →
            </button>
          </div>

          <div className={isStudio ? "bg-white/80 p-3" : "p-3"} id={gridId} role="dialog" aria-label={label}>
            <div className="grid grid-cols-7 gap-1 px-1 pb-2">
              {weekDays.map((d) => (
                <div key={d} className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 px-1">
              {grid.map((d) => {
                const dk = dateKeyLocal(d);
                const disabled = minDate ? d.getTime() < minDate.getTime() : false;
                const inMonth = isSameMonth(d, month);
                const isSelected = isSameDay(d, selected);
                return (
                  <button
                    key={dk}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      onChange(dk);
                      setOpen(false);
                      buttonRef.current?.focus();
                    }}
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-semibold tabular-nums transition",
                      isStudio
                        ? isSelected
                          ? "border-[var(--ice)]/40 bg-[var(--ice)]/12 font-semibold text-[var(--ice)] ring-1 ring-[var(--ice)]/25"
                          : "border-transparent bg-white/70 text-[var(--fg)] hover:border-[var(--line)]/80 hover:bg-white"
                        : [
                            "border-white/10 bg-black/20 text-[var(--fg)]",
                            isSelected
                              ? "border-[var(--ice)]/35 bg-[var(--ice)]/14 font-semibold text-[var(--ice)] ring-1 ring-[var(--ice)]/25"
                              : "hover:bg-white/7",
                          ].join(" "),
                      inMonth ? "" : "opacity-55",
                      disabled ? "cursor-not-allowed opacity-35" : "",
                      !isStudio && disabled ? "hover:bg-black/20" : "",
                    ].join(" ")}
                    aria-pressed={isSelected}
                    aria-disabled={disabled ? true : undefined}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

